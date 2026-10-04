# Release Management

Releases follow the org versioning policy (nyuchi/.github#80). Nobody pushes a
tag by hand, and nobody runs `gh release create`.

| Event                           | Version                       | Workflow                                 |
| ------------------------------- | ----------------------------- | ---------------------------------------- |
| A PR merges into `staging`      | next PATCH, `x.y.z → x.y.z+1` | `.github/workflows/staging-version.yml`  |
| `staging` is released to `main` | next MINOR, `x.y.z → x.y+1.0` | `.github/workflows/release.yml`          |
| A MAJOR                         | by hand only                  | Actions → Release → Run workflow (major) |

Each segment holds 0..999: patch 999 rolls into the next minor, and minor 999
is refused and asks for a manual major.

## How a release happens

```
feature PR → staging   →  staging-version.yml tags the next patch (beta)
                           Vercel deploys the beta (see Release channels)
                        ↓
release PR staging → main, carrying the version bump + CHANGELOG
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

The release PR from `staging` into `main` carries the version bump. Work out the
next minor above the highest tag (`git tag -l 'v*' --sort=-v:refname | head -1`;
`v0.4.3` → `0.5.0`), then:

```bash
npm run release:prepare -- --version 0.5.0
```

This bumps every version file and moves `CHANGELOG.md`'s `[Unreleased]` section
under the new heading. Commit the result to the release PR. If the version is not
the one the policy allows, the Release run fails and names the right one.

### What the script writes

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
# What the script would write, writing nothing
npm run release:dry

# Manual release from the Actions tab:
#   Actions → Release → Run workflow
#     bump: minor (default), patch, or major (a major is only made here)
```

## Versioning

Mukoko Lingo follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`.

- **MAJOR** — breaking changes (manual below 1.0, see above)
- **MINOR** — new features, backwards-compatible
- **PATCH** — bug fixes, security patches, small improvements

### Current Version: 0.4.0

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

- **Cutting 1.0.0** — `workflow_dispatch` with `bump: major`.
- **Environment variables** — a release does not carry config. New variables
  (see `.env.example`) must exist in Vercel before the code that reads them
  merges.

## Hotfixes

Branch from `staging`, fix, PR into `staging`, then release `staging` to `main`
as above. A release to `main` is always the next minor.

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

## Version history

| Version | Date       | Highlights                                                                                        |
| ------- | ---------- | ------------------------------------------------------------------------------------------------- |
| 0.4.0   | 2026-09-10 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.3.0   | 2026-09-09 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.2.0   | 2026-09-08 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.1.1   | 2026-09-01 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.1.0   | 2026-09-01 | See [CHANGELOG](CHANGELOG.md)                                                                     |
| 0.0.1   | 2026-04-08 | Initial release: Supabase migration, Next.js web app, school model, OneRoster, security hardening |

## Contact

- Engineering: <dev@mukoko.com>
- Security: <security@nyuchi.com>
