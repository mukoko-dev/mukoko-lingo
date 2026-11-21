# Release Management

Releases follow the org versioning policy (nyuchi/.github#80). Nobody pushes a
tag by hand, and nobody runs `gh release create`.

| Event                           | Version                       | Workflow                                |
| ------------------------------- | ----------------------------- | --------------------------------------- |
| A PR merges into `staging`      | next PATCH, `x.y.z → x.y.z+1` | `.github/workflows/staging-version.yml` |
| `staging` is released to `main` | next MINOR, `x.y.z → x.y+1.0` | `.github/workflows/release.yml`         |
| A MAJOR                         | by hand only                  | prepare `X.0.0`, then Release `major`   |

Each segment holds 0..999: patch 999 rolls into the next minor, and minor 999
is refused and asks for a manual major.

## How a release happens

```
feature PR → staging   →  staging-version.yml tags the next patch (beta)
                           Vercel deploys the beta (see Release channels)
                        ↓
release PR staging → main, carrying the version bump + CHANGELOG
   Conventional Commits since the last tag decide whether to release;
     the org policy (next-version action) sets the number: next MINOR
                        ↓
              CI workflow runs on the push to main
                        ↓ (success)
                 Release workflow (workflow_run)
                        ↓
  package.json version = next minor above the highest tag?  (else: fail)
                        ↓
              annotated tag vX.Y.0 → GitHub Release
```

The gate is the **CI workflow's conclusion**: a merge whose tests fail is never
tagged. The logic is the org's pinned `reusable-auto-tag.yml` (`channel: main`,
reading `package.json`), and the tag is pushed with `RELEASE_BUMP_TOKEN`. A merge
that does not change the version finds its tag already there and does nothing.

Staging tags (`v0.4.1`, `v0.4.2`, …) are pushed with `GITHUB_TOKEN`, so they
start no workflow and publish nothing.

### Preparing the release PR

The release PR from `staging` into `main` carries the version bump. When the
release branch is built from `staging`'s tree, make the bump as the last PR into
`staging` just before the release, so nothing lands under `[Unreleased]` between
the bump and the release. Work out the
next minor above the highest tag (`git tag -l 'v*' --sort=-v:refname | head -1`;
`v0.4.3` → `0.5.0`), then:

```bash
npm run release:prepare -- --version 0.5.0
```

This bumps every version file and moves `CHANGELOG.md`'s `[Unreleased]` section
under the new heading. Commit the result to the release PR. If the version is not
the one the policy allows, the Release run fails and names the right one.

### What the script writes
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

**Whether** a merge releases: `scripts/release/version.js` reads the
Conventional Commit subjects between the last `v*` tag and the merge commit:

| Commit type                                           | Releases? | Changelog group |
| ----------------------------------------------------- | --------- | --------------- |
| `feat:`                                               | yes       | Added           |
| `fix:`                                                | yes       | Fixed           |
| `perf:`, `refactor:`, `revert:`                       | yes       | Changed         |
| any `(security)` scope                                | yes       | Security        |
| `docs:`, `chore:`, `ci:`, `test:`, `style:`, `build:` | **no**    | —               |
| anything not matching `type(scope): subject`          | **no**    | —               |

**The number**: the org versioning policy ([nyuchi/.github#80](https://github.com/nyuchi/.github/issues/80)), computed by the shared
`next-version` action and passed to `prepare-release.js` as
`--policy-version`:

| Event                                      | Bump  | Example       |
| ------------------------------------------ | ----- | ------------- |
| A merge into `staging` (the live beta)     | PATCH | 0.4.0 → 0.4.1 |
| A release to `main`                        | MINOR | 0.4.1 → 0.5.0 |
| A person runs _Release_ with `bump: major` | MAJOR | 0.5.0 → 1.0.0 |

Each segment holds 0–999: patch 999 rolls into the next minor, and minor 999
stops and asks for a manual major. Versions released before 2026-10-04 are not
renumbered.

Two consequences worth knowing:

- **A docs-only or CI-only merge releases nothing.** The job runs, reports "No
  release" in its summary, and exits 0. That is the designed outcome, not a
  failure to investigate.
- **No commit subject makes a major.** A `type!:` subject or a
  `BREAKING CHANGE:` footer still releases, as the next minor. A major is a
  product decision, made by hand.

### What the job writes

| File                                         | Field                                                       |
| -------------------------------------------- | ----------------------------------------------------------- |
| `package.json`                               | `version`                                                   |
| `web/package.json`                           | `version`                                                   |
| `package-lock.json`, `web/package-lock.json` | `version` + `packages[""].version`                          |
| `app.json`                                   | `expo.version`                                              |
| `constants/Version.ts`                       | `APP_VERSION`                                               |
| `CHANGELOG.md`                               | `[Unreleased]` → `[X.Y.Z] — date`, new empty `[Unreleased]` |
| `RELEASES.md`                                | Current Version + a Version History row                     |
| `CLAUDE.md`                                  | Project Status → Current Version                            |

The first five are **required**: if one of them stops matching its marker (a
reformat, a rename), the script fails loudly rather than leaving a half-bumped
tree. `scripts/release/__tests__/version-files.test.js` runs each transform
against the real files in CI.

### Release notes

Keep `CHANGELOG.md`'s `[Unreleased]` section current as work lands; it becomes
the version's section when the release PR is prepared. The GitHub Release itself
carries generated notes.

## Running it yourself

```bash
# What the script would write for a version, writing nothing. Without
# --version it falls back to the old commit-type bump, which is not the policy.
npm run release:dry -- --version 0.6.0

# Manual release from the Actions tab:
#   Actions → Release → Run workflow
#     on main only; it tags the version package.json already carries
#     (bump: major is how a prepared X.0.0 is accepted)
#     bump:     minor (default), patch, or major (only ever by hand)
#     dry_run:  true to see the plan without tagging
```

## Versioning

Mukoko Lingo follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR** — only ever by hand (prepare `X.0.0`, then Release with `bump: major`)
- **MAJOR** — only ever by hand (`workflow_dispatch`, `bump: major`)
- **MINOR** — a release to `main`
- **PATCH** — a merge into `staging` (the live beta)

### Current Version: 0.5.0

## Release channels

### Production

- **Branch**: `main`
- **Environment**: Vercel Production
- **URL**: <https://lingo.mukoko.com> (Expo web), `/console` (Next.js web app)
- **Database**: MongoDB, database `lingo` (shared across the Nyuchi ecosystem)
- **Auth**: WorkOS AuthKit (Production environment)
- **AI**: Cloudflare Workers AI via Cloudflare AI Gateway

### Beta

- **Branch**: `staging`
- **Environment**: Vercel Preview (behind Vercel Authentication)
- **URL**: <https://mukoko-lingo-staging.vercel.app> (Expo web),
  <https://mukoko-lingo-console-staging.vercel.app> (Next.js web app)
- **Database**: the same MongoDB database — treat writes with care

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

- **Cutting 1.0.0** — `npm run release:prepare -- --version 1.0.0` in the
  release PR. The automatic run after the merge refuses a major; run
  _Release_ on `main` with `bump: major` to tag it.
- **Cutting 1.0.0** (or any major) — `workflow_dispatch` with `bump: major`.
- **Environment variables** — a release does not carry config. New variables
  (see `.env.example`) must exist in Vercel before the code that reads them
  merges.

## Hotfixes

Branch from `staging`, fix, PR into `staging`, then release `staging` to `main`
as above. A release to `main` is always the next minor.
Nothing special: branch, fix, PR, merge. A `fix:` commit on `main` with green CI
cuts a release on its own (the next minor, under the policy).

```bash
git checkout staging && git pull
git checkout -b hotfix/short-description
# fix, commit as `fix(scope): ...`, push, PR, merge
```

## If a release does not appear

| Symptom                                  | Cause                                               | Fix                                                                     |
| ---------------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------------- |
| Release run fails naming another version | `package.json` is not the next minor above the tags | Re-run `npm run release:prepare -- --version <named>` in a PR to `main` |
| Job did not run at all                   | CI failed, or the merge commit carried `[skip ci]`  | Fix CI; re-run the CI workflow on that commit                           |
| Job ran and did nothing                  | The version's tag already exists                    | Nothing to do: the merge did not change the version                     |
| Symptom                                            | Cause                                                                          | Fix                                                                                                                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Job ran, summary says "No release"                 | Only housekeeping commits since the last tag                                   | Nothing to do, or dispatch manually                                                                                                                                                                                                     |
| Job did not run at all                             | CI failed, or the merge commit carried `[skip ci]`                             | Fix CI; re-run the CI workflow on that commit                                                                                                                                                                                           |
| Warning: "Could not push the version bump to main" | `RELEASE_BUMP_TOKEN` did not reach the job, or its owner cannot push to `main` | The tag and Release are still published against the merge commit; the version files need landing by hand. Check the org secret's repository access list includes `mukoko-lingo`, and that the token can push through the `main` ruleset |
| "Tag vX.Y.Z already exists"                        | A previous run got as far as tagging                                           | Delete the tag if the release is incomplete, then re-dispatch                                                                                                                                                                           |

## Version history

| Version | Date       | Highlights                                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 0.5.0   | 2026-10-06 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.4.0   | 2026-09-10 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.3.0   | 2026-09-09 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.2.0   | 2026-09-08 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.1.1   | 2026-09-01 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.1.0   | 2026-09-01 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.0.1   | 2026-04-08 | Initial release: Supabase migration, Next.js web app, school model, OneRoster, security hardening |

## Contact

- Engineering: <dev@mukoko.com>
- Security: <security@nyuchi.com>
