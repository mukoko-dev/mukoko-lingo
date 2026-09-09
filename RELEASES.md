# Release Management

Releases are **automatic**. A merge to `main` whose CI run goes green is tagged
and published by `.github/workflows/release.yml` — nobody bumps a version by
hand, and nobody runs `gh release create`.

This document explains what that job does, what makes it fire (and what makes
it stay quiet), and the few things still done by a person.

## How a release happens

```
PR merged to main  →  CI workflow runs on the merge commit
                        ↓ (success)
                   Release workflow (workflow_run)
                        ↓
      derive next version from Conventional Commits since the last tag
                        ↓
   bump version files + move CHANGELOG [Unreleased] under the new heading
                        ↓
        commit "chore(release): vX.Y.Z [skip ci]" → push to main
                        ↓
              annotated tag vX.Y.Z → GitHub Release
```

The gate is the **CI workflow's conclusion**, not the push itself: a merge whose
tests fail is never tagged. The release commit carries `[skip ci]`, so it cannot
start a CI run that would re-trigger the release job.

**The bump commit is pushed with `RELEASE_BUMP_TOKEN`**, the org-wide PAT that
can push through branch protection. The job checks out with
`secrets.RELEASE_BUMP_TOKEN || secrets.RELEASE_TOKEN || secrets.GITHUB_TOKEN`,
so a per-repo `RELEASE_TOKEN` overrides it if one is ever needed, and neither
being present is not fatal.

**When the bump commit cannot be pushed** — the org secret not granted to this
repository, its owner unable to push to `main`, or `main` having moved on while
CI ran — the job still tags the merge commit and publishes the Release, and
logs a warning naming the likely cause. The version files and `CHANGELOG.md`
then sit behind the tag until someone lands them by hand. The next release is
not confused by that: the version is counted from the newer of the last tag and
`package.json`, so a published `v0.1.0` with files still reading `0.0.1` still
yields `0.1.1`, never `0.0.2`.

### What decides the version

`scripts/release/version.js` reads the Conventional Commit subjects between the
last `v*` tag and the merge commit, and takes the largest bump any of them asks
for:

| Commit type | Bump | Changelog group |
|---|---|---|
| `feat:` | minor | Added |
| `fix:` | patch | Fixed |
| `perf:`, `refactor:`, `revert:` | patch | Changed |
| any `(security)` scope | patch | Security |
| `docs:`, `chore:`, `ci:`, `test:`, `style:`, `build:` | **none** | — |
| `type!:` or a `BREAKING CHANGE:` footer | major | — |
| anything not matching `type(scope): subject` | **none** | — |

Two consequences worth knowing:

- **A docs-only or CI-only merge releases nothing.** The job runs, reports "No
  release" in its summary, and exits 0. That is the designed outcome, not a
  failure to investigate.
- **Below 1.0.0 a breaking change lands as a minor** (`0.3.7` → `0.4.0`).
  Semver already allows anything to break in `0.x`, and declaring 1.0 is a
  product decision — not something an automated job should make because a
  commit subject had a `!` in it.

### What the job writes

| File | Field |
|------|-------|
| `package.json` | `version` |
| `web/package.json` | `version` |
| `package-lock.json`, `web/package-lock.json` | `version` + `packages[""].version` |
| `app.json` | `expo.version` |
| `constants/Version.ts` | `APP_VERSION` |
| `CHANGELOG.md` | `[Unreleased]` → `[X.Y.Z] — date`, new empty `[Unreleased]` |
| `RELEASES.md` | Current Version + a Version History row |
| `CLAUDE.md` | Project Status → Current Version |

The first five are **required**: if one of them stops matching its marker (a
reformat, a rename), the job fails loudly rather than shipping a half-bumped
tree. `scripts/release/__tests__/version-files.test.js` runs each transform
against the real files in CI, so that breakage surfaces in a PR instead of in a
release.

### Release notes

The notes published on the GitHub Release are the `[Unreleased]` section of
`CHANGELOG.md`, verbatim. Keep that section current as work lands — it is the
release notes, written by the people who did the work.

If `[Unreleased]` is empty, the job falls back to generating entries from the
commit subjects in the range. That fallback exists so a release is never
blocked, not because a list of subjects is a good changelog. If nothing at all
qualifies, no release is cut.

## Running it yourself

```bash
# Exactly what a merge to main would produce, writing nothing
npm run release:dry

# Manual release from the Actions tab:
#   Actions → Release → Run workflow
#     version:  blank to derive, or an explicit 0.2.0
#     dry_run:  true to see the plan without tagging
```

`workflow_dispatch` is the escape hatch for the cases automation should not
decide: cutting `1.0.0`, releasing after a revert, or re-running a job that
failed partway.

## Versioning

Mukoko Lingo follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR** — breaking changes (manual below 1.0, see above)
- **MINOR** — new features, backwards-compatible
- **PATCH** — bug fixes, security patches, small improvements

### Current Version: 0.3.0

## Release channels

### Production
- **Branch**: `main`
- **Environment**: Vercel Production
- **URL**: https://lingo.mukoko.com (Expo web), `/console` (Next.js web app)
- **Database**: MongoDB, database `lingo` (shared across the Nyuchi ecosystem)
- **Auth**: WorkOS AuthKit (Production environment)
- **AI**: Cloudflare Workers AI via Cloudflare AI Gateway

### Preview
- **Branch**: any PR branch
- **Environment**: Vercel Preview
- **Database**: the same MongoDB database — treat writes with care

Vercel deploys on merge to `main` independently of the release job. A tag is a
marker of what shipped, not the thing that ships it.

## What is still manual

- **Native builds (EAS)** — the release job does not build or submit apps.
  ```bash
  npx eas build --profile production --platform all
  npx eas update --branch production   # OTA JS-only update
  ```
- **Cutting 1.0.0** — `workflow_dispatch` with an explicit version.
- **Environment variables** — a release does not carry config. New variables
  (see `.env.example`) must exist in Vercel before the code that reads them
  merges.

## Hotfixes

Nothing special: branch, fix, PR, merge. A `fix:` commit on `main` with green CI
cuts a patch release on its own.

```bash
git checkout main && git pull
git checkout -b hotfix/short-description
# fix, commit as `fix(scope): ...`, push, PR, merge
```

## If a release does not appear

| Symptom | Cause | Fix |
|---|---|---|
| Job ran, summary says "No release" | Only housekeeping commits since the last tag | Nothing to do, or dispatch manually with a version |
| Job did not run at all | CI failed, or the merge commit carried `[skip ci]` | Fix CI; re-run the CI workflow on that commit |
| Warning: "Could not push the version bump to main" | `RELEASE_BUMP_TOKEN` did not reach the job, or its owner cannot push to `main` | The tag and Release are still published against the merge commit; the version files need landing by hand. Check the org secret's repository access list includes `mukoko-lingo`, and that the token can push through the `main` ruleset |
| "Tag vX.Y.Z already exists" | A previous run got as far as tagging | Delete the tag if the release is incomplete, then re-dispatch |

## Version history

| Version | Date | Highlights |
|---------|------|------------|
| 0.3.0 | 2026-09-09 | See [CHANGELOG](CHANGELOG.md) |
| 0.2.0 | 2026-09-08 | See [CHANGELOG](CHANGELOG.md) |
| 0.1.1 | 2026-09-01 | See [CHANGELOG](CHANGELOG.md) |
| 0.1.0 | 2026-09-01 | See [CHANGELOG](CHANGELOG.md) |
| 0.0.1 | 2026-04-08 | Initial release: Supabase migration, Next.js web app, school model, OneRoster, security hardening |

## Contact

- Engineering: dev@mukoko.com
- Security: security@mukoko.com
