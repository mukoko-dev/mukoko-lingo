# Mukoko Lingo

**AI-first, skills-based multilingual language learning platform** — for individuals, schools, and businesses across Africa.

Learn Shona, Ndebele, Chinese, and English with AI-powered tutoring by Shamwari.

Built with Expo SDK 57 / React Native, Next.js, MongoDB, WorkOS AuthKit, Vercel Serverless, and Anthropic Claude.

**Parent Company**: [Nyuchi Africa](https://nyuchi.com) | **Registry**: [registry.mukoko.com](https://registry.mukoko.com)

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start mobile dev server
npx expo start

# Start web app (separate terminal)
cd web && npm install && npm run dev
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

- `MONGODB_URI` — MongoDB connection string
- `WORKOS_API_KEY` / `WORKOS_CLIENT_ID` — WorkOS AuthKit credentials
- `ANTHROPIC_API_KEY` — Anthropic Claude API key (server-side only)
- `EXPO_PUBLIC_API_BASE_URL` — Vercel API base URL

See `.env.example` for the complete list.

## Two Apps, One Backend

| Platform | Technology | For |
|----------|-----------|-----|
| **Mobile** (`/app`) | Expo/React Native | Individuals learning on the go (iOS + Android) |
| **Web** (`/web`) | Next.js + Tailwind | Individuals, schools, businesses on any browser |
| **API** (`/api`) | Vercel Serverless | Shared backend (52 endpoints) |

Both apps call the same API routes. The web app includes all learner features plus admin/org management.

## Key Features

- **Daily Lessons** — Smart phrase selection (5 phrases/day) with flash cards and mini-quizzes
- **230+ Phrases** — 4 languages with pronunciation guides and cultural context
- **Shamwari AI Tutor** — Claude-powered tutor that adapts to learner proficiency
- **Skills & Assessments** — 5 core skills with diagnostic, formative, and summative tests
- **Classes & Assignments** — Teachers create classes, assign phrases, track student progress
- **OneRoster Integration** — Sync school rosters from Clever, ClassLink, PowerSchool
- **Content Moderation** — Local guardrails + AI-based + prompt injection detection
- **Admin Dashboard** — Users, phrases, moderation, guardrails, analytics, API keys (web only)

## Mobile App Navigation

| Tab | Purpose |
|-----|---------|
| **Learn** | Daily lessons (flash cards + quiz) and phrase browsing |
| **Shamwari** | AI tutor chat powered by Anthropic Claude |
| **Progress** | Dashboard, bookmarks, skill proficiency, mastery tracking |
| **Profile** | Settings, preferences, theme, sign out |

## Architecture

| Layer | Technology |
|-------|-----------|
| Mobile Frontend | Expo SDK 54 / React Native 0.81 / React 19 |
| Web Frontend | Next.js 15 / Tailwind CSS / Five African Minerals |
| Routing | Expo Router 6 (mobile) / Next.js App Router (web) |
| Backend | Vercel Serverless Functions (TypeScript + Python) |
| Database | MongoDB (database `lingo` — shared with the Nyuchi ecosystem, see below) |
| Auth | WorkOS AuthKit (hosted sign-in, PKCE authorization-code flow) |
| AI | Anthropic Claude Haiku 4.5 (server-side proxy with circuit breaker) |
| Testing | Jest 29 + jest-expo (24 suites, 298 tests) |
| CI/CD | GitHub Actions (typecheck → test → build-web) |

## Development Commands

```bash
# Mobile development
npx expo start              # Dev server (mobile + web)
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator

# Web development
cd web && npm run dev        # Next.js dev server

# Build & Deploy
npm run build:web           # Export Expo web build for Vercel
cd web && npm run build     # Build Next.js web app

# Testing & Quality
npm test                    # Run all tests (24 suites, 298 tests)
npm run test:coverage       # Tests with coverage report
npx tsc --noEmit            # TypeScript type check
```

## Database Schema

MongoDB cluster shared across the Nyuchi ecosystem — `lingo` is Lingo's own database, but several collections read/write sibling databases owned by other domains/apps (see `docs/ECOSYSTEM_DATA_MIGRATION.md` for the full migration history).

**Shared, not Lingo-owned:**

| Collection | Purpose |
|------------|---------|
| `identity.persons` | Real ecosystem user record (UUID `_id`, OIDC claims, `workosUserId`) |
| `lingo.phrases`, `lingo.languages`, `lingo.scenarios`, `lingo.learningStandards` | Real, ecosystem-curated multilingual content (`translations[]` per phrase, not flat per-language fields) |
| `shamwari.guardrails` | Content moderation rules |
| `shamwari.conversations`, `shamwari.messages` | Shamwari AI chat (messages are their own collection, not embedded) |
| `ubuntu.contributions` | Trust/gamification ledger — Lingo mirrors XP events into it (`sourceDomain: "lingo"`) |
| `platform.apiKeys` | Org-issued developer API keys (`ownerEntityId`, `keyType: internal/external`) |

**Lingo-local** (`lingo` database, no ecosystem equivalent exists):

| Collection | Purpose |
|------------|---------|
| `learner_profiles` | Lingo-specific extension of `identity.persons` (role, learning prefs, push tokens), keyed on `person_id` |
| `phrase_progress`, `bookmarks`, `phrase_views` | Per-user learning activity |
| `phraseEngagementLive` | Read-only aggregation view over `bookmarks`/`phrase_views`, not a stored counter |
| `skills`, `user_skills`, `assessments`, `user_assessments` | Skills-based progression |
| `classes`, `class_memberships`, `assignments`, `assignment_submissions`, `organization_enrollments` | Schools/orgs |
| `srs_cards`, `user_xp`, `xp_events`, `study_sessions` | Spaced repetition + XP/streaks |
| `moderation_alerts` | Flagged content pending review |

## CI/CD Pipeline

GitHub Actions runs on push to `main`/`feature/*` and PRs to `main`:

1. **TypeScript Check** — `npx tsc --noEmit`
2. **Jest Tests** — `npm test -- --ci --coverage`
3. **Build Web** — `npx expo export --platform web`

## Documentation

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — 5-layer component hierarchy and data layer awareness
- **[CLAUDE.md](CLAUDE.md)** — Developer guide & full architecture reference
- **[BRANDING.md](BRANDING.md)** — Brand guidelines & Five African Minerals design system
- **[SECURITY.md](SECURITY.md)** — Security architecture
- **[CONTRIBUTING.md](CONTRIBUTING.md)** — Contribution guidelines
- **[CHANGELOG.md](CHANGELOG.md)** — Version history

## Brand — Five African Minerals

| Mineral | Light | Dark | Role |
|---------|-------|------|------|
| Cobalt | `#0047AB` | `#00B0FF` | Primary (trust, clarity) |
| Tanzanite | `#4B0082` | `#B388FF` | Secondary (depth, creativity) |
| Malachite | `#004D40` | `#64FFDA` | Success (positive actions) |
| Gold | `#5D4037` | `#FFD740` | Accent (achievement, warmth) |
| Terracotta | `#8c5f38` | `#D4A574` | Community (warmth) |

## License

[MIT](LICENSE)
