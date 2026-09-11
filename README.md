# Mukoko Lingo

> AI-assisted, skills-based language learning for individuals, schools and
> businesses across Africa.

[![CI](https://github.com/mukoko-dev/mukoko-lingo/actions/workflows/ci.yml/badge.svg)](https://github.com/mukoko-dev/mukoko-lingo/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=flat-square&logo=expo&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?style=flat-square&logo=mongodb&logoColor=white)
![WorkOS](https://img.shields.io/badge/Auth-WorkOS-6363F1?style=flat-square&logo=workos&logoColor=white)

**Version:** 0.4.0 | **Live:** [lingo.mukoko.com](https://lingo.mukoko.com) |
**Console:** [lingo.nyuchi.com/console](https://lingo.nyuchi.com/console) |
**Parent company:** [Nyuchi Africa](https://nyuchi.com)

---

## What it is

Mukoko Lingo teaches Shona, Ndebele, Chinese and English. A learner gets five
phrases a day, drilled with flash cards and a short quiz, with spaced repetition
scheduling what comes back and when. Shamwari, the AI tutor, answers questions
in chat and adapts to the learner's measured proficiency rather than to a level
they picked for themselves.

The other half of the product is institutional. Teachers create classes, set
assignments against specific phrases and skills, and watch progress per student.
Assessments are diagnostic, formative and summative, and they are graded on the
server — the client is not trusted with a score. School rosters sync in over
OneRoster from Clever, ClassLink and PowerSchool. Organisation admins get users,
content, moderation, guardrails, analytics and API keys.

Content moderation runs in three layers: local rule-based guardrails, an
AI-based pass, and prompt-injection detection on anything a learner types at
the tutor.

### Languages

This is more subtle than a single list, so here it is precisely:

| Language       | UI strings | Local phrase seed | Shared `lingo.languages` |
| -------------- | :--------: | :---------------: | :----------------------: |
| English (`en`) |     ✅     |        ✅         |            ✅            |
| Shona (`sn`)   |     ✅     |        ✅         |            ✅            |
| Ndebele (`nd`) |     ✅     |        ✅         |            ✅            |
| Chinese (`zh`) |     ✅     |        ✅         |            ✅            |
| Swahili (`sw`) |     ✅     |        ✅         |            ❌            |

Four languages are canonical. Swahili is offered in the app's language picker
(`lib/hooks/useUILanguage.tsx`) and carried in the local seed data
(`lib/data/phrases-data.ts`), but `lib/db/phrase-shape.ts` maps only `en`, `sn`,
`nd` and `zh` into the shared database, so Swahili content does not round-trip.
Treat it as unfinished, not as a supported language.

The seed file holds **130 phrases**. Live phrase content is curated in the
shared `lingo.phrases` collection and is not bounded by what is in this repo.

---

## Two apps, one backend

| Surface | Path   | Stack                                    | For                                     |
| ------- | ------ | ---------------------------------------- | --------------------------------------- |
| Mobile  | `app/` | Expo SDK 57, React Native 0.86, React 19 | Individuals learning on iOS and Android |
| Console | `web/` | Next.js 16, Tailwind CSS 4               | Schools, businesses, admins             |
| API     | `api/` | Vercel serverless functions              | Both                                    |

`api/` holds 58 TypeScript functions and four Python analytics functions, with
shared helpers in `api/_lib`. `web/` is an independent npm project with its own
lockfile — it is not a workspace of the root package — and it is served under
`basePath: '/console'` so it can share a custom domain root with the mobile web
export.

### Mobile navigation

| Tab          | Purpose                                                    |
| ------------ | ---------------------------------------------------------- |
| **Learn**    | Daily lesson — flash cards and quiz — plus phrase browsing |
| **Shamwari** | AI tutor chat                                              |
| **Progress** | Dashboard, bookmarks, skill proficiency, mastery           |
| **Profile**  | Settings, preferences, theme, sign out                     |

---

## Architecture

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Mobile front end | Expo SDK 57 / React Native 0.86.2 / React 19.2 / Expo Router 57       |
| Console          | Next.js 16.2 / Tailwind CSS 4                                         |
| Backend          | Vercel serverless functions (TypeScript and Python)                   |
| Database         | MongoDB — the `lingo` database on the shared Nyuchi ecosystem cluster |
| Auth             | WorkOS AuthKit (hosted sign-in, PKCE authorization-code flow)         |
| AI               | Cloudflare Workers AI — Qwen3 30B A3B through an AI Gateway proxy     |
| Testing          | Jest 29 + jest-expo — 44 test files                                   |
| CI/CD            | GitHub Actions, with automated releases                               |

There is no Cloudflare Worker in this repository. Workers AI is called over
HTTP from the Vercel functions, behind a server-side proxy with a circuit
breaker; the Cloudflare credentials never reach a client.

### Database

The MongoDB cluster is shared across the Nyuchi ecosystem. `lingo` is Lingo's
own database, but several collections read and write sibling databases owned by
other domains. `docs/ECOSYSTEM_DATA_MIGRATION.md` has the full history.

**Shared, not Lingo-owned:**

| Collection                                                        | Purpose                                                   |
| ----------------------------------------------------------------- | --------------------------------------------------------- |
| `identity.persons`                                                | The ecosystem user record — UUID `_id`, OIDC claims       |
| `lingo.phrases`, `.languages`, `.scenarios`, `.learningStandards` | Curated multilingual content, `translations[]` per phrase |
| `shamwari.guardrails`                                             | Moderation rules                                          |
| `shamwari.conversations`, `.messages`                             | Tutor chat                                                |
| `ubuntu.contributions`                                            | Trust ledger — Lingo mirrors XP events into it            |
| `platform.apiKeys`                                                | Org-issued developer API keys                             |

**Lingo-local:**

| Collection                                                                                          | Purpose                                 |
| --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `learner_profiles`                                                                                  | Lingo's extension of `identity.persons` |
| `phrase_progress`, `bookmarks`, `phrase_views`, `phraseEngagementLive`                              | Learning activity                       |
| `skills`, `user_skills`, `assessments`, `user_assessments`                                          | Skills-based progression                |
| `classes`, `class_memberships`, `assignments`, `assignment_submissions`, `organization_enrollments` | Schools and orgs                        |
| `srs_cards`, `user_xp`, `xp_events`, `study_sessions`                                               | Spaced repetition, XP, streaks          |
| `moderation_alerts`                                                                                 | Flagged content awaiting review         |

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values below
npx expo start               # mobile dev server

cd web && npm install && npm run dev   # console, separate terminal
```

Required environment variables:

- `MONGODB_URI`
- `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`
- `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_AI_GATEWAY_ID`
- `EXPO_PUBLIC_API_BASE_URL`

`.env.example` has the complete list.

## Commands

| Command                   | Description                                 |
| ------------------------- | ------------------------------------------- |
| `npx expo start`          | Mobile dev server (add `--ios`/`--android`) |
| `npm run build:web`       | Export the Expo web build for Vercel        |
| `npm test`                | Jest                                        |
| `npm run test:coverage`   | Jest with coverage                          |
| `npm run lint`            | ESLint                                      |
| `npx tsc --noEmit`        | Type check                                  |
| `npm run build:ios`       | EAS build                                   |
| `cd web && npm run dev`   | Console dev server                          |
| `cd web && npm run build` | Console production build                    |

## CI and releases

`ci.yml` runs on pushes to `main` and `feature/*` and on pull requests to
`main`: lint and typecheck for mobile and for web, Jest, a docs drift check
(`scripts/docs/check-docs.js`), `ruff` and `pytest` for the Python analytics
functions, and both builds. The EAS iOS and Android build jobs are present but
commented out.

Releases are automatic. When CI goes green on `main`, `release.yml` derives the
next version from the Conventional Commit subjects since the last tag, bumps
every version file, cuts `CHANGELOG.md`'s `[Unreleased]` section into a version
heading, tags, and publishes a GitHub Release. A docs- or chore-only merge
releases nothing. See [RELEASES.md](RELEASES.md).

---

## Brand

The Bundu brand system has seven minerals — cobalt, tanzanite, malachite, gold,
terracotta, sodalite and copper — inside a palette of 21 colour families. Mukoko
Lingo uses a subset of them, and the mobile app and the console currently use
different subsets:

| Surface | Colours defined                                                              | Source                   |
| ------- | ---------------------------------------------------------------------------- | ------------------------ |
| Mobile  | Cobalt (primary), Tanzanite (secondary), Gold (accent), Army Green (success) | `constants/Colors.ts`    |
| Console | Cobalt, Tanzanite, Malachite, Gold, Terracotta, plus Army Green              | `web/tailwind.config.ts` |

Army Green (`#729B63` / `#8FB47F`) is not a mineral. It is a Lingo-specific
success colour. [BRANDING.md](BRANDING.md) is the design authority and specifies
the four-colour mobile set; the console config is ahead of it. Reconcile them
before adding anything new.

The dark theme is charcoal (`#0A0A0A`), never slate.

---

## Documentation

| Document                                                             | Purpose                                         |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| [CLAUDE.md](CLAUDE.md)                                               | Developer guide and full architecture reference |
| [BRANDING.md](BRANDING.md)                                           | Brand guidelines, palette, voice, typography    |
| [SECURITY.md](SECURITY.md)                                           | Security architecture                           |
| [CONTRIBUTING.md](CONTRIBUTING.md)                                   | Contribution guidelines and commit conventions  |
| [RELEASES.md](RELEASES.md)                                           | Release automation and channels                 |
| [CHANGELOG.md](CHANGELOG.md)                                         | Version history                                 |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)                             | Community expectations                          |
| [docs/ECOSYSTEM_DATA_MIGRATION.md](docs/ECOSYSTEM_DATA_MIGRATION.md) | How Lingo's data joined the shared cluster      |
| [docs/TEST_COVERAGE_ANALYSIS.md](docs/TEST_COVERAGE_ANALYSIS.md)     | What the test suite covers                      |

## Ecosystem

| Repository                                                            | What it is                        |
| --------------------------------------------------------------------- | --------------------------------- |
| [`mukoko-dev/mukoko`](https://github.com/mukoko-dev/mukoko)           | The super app monorepo            |
| [`mukoko-dev/mukoko-auth`](https://github.com/mukoko-dev/mukoko-auth) | Mukoko ID — identity and SSO      |
| [`mukoko-dev/kweli-mcp`](https://github.com/mukoko-dev/kweli-mcp)     | Business, places and verification |

## Licence

Licensed under the [MIT Licence](LICENSE). © 2025 Nyuchi Learning.
