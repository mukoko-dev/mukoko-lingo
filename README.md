# Mukoko Lingo

**AI-first, skills-based multilingual language learning platform** — for individuals, schools, and businesses across Africa.

Learn Shona, Ndebele, Chinese, and English with AI-powered tutoring by Shamwari.

Built with Expo SDK 54 / React Native, Next.js, Supabase PostgreSQL, Stytch Auth, Vercel Serverless, and Anthropic Claude.

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

- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — Supabase PostgreSQL
- `STYTCH_PROJECT_ID` / `STYTCH_SECRET` — Stytch auth credentials
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
| Database | Supabase PostgreSQL (lingo / identity / system schemas) |
| Auth | Stytch SDK 13 (email/password, OTP, magic links, WhatsApp) |
| AI | Anthropic Claude Haiku 4.5 (server-side proxy with circuit breaker) |
| Testing | Jest 29 + jest-expo (18 suites, 226 tests) |
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
npm test                    # Run all tests (18 suites, 226 tests)
npm run test:coverage       # Tests with coverage report
npx tsc --noEmit            # TypeScript type check
```

## Database Schema

Three Supabase PostgreSQL schemas:

| Schema | Tables | Purpose |
|--------|--------|---------|
| `lingo` | 18 | Phrases, translations, progress, skills, classes, assignments, AI conversations |
| `identity` | 1 | User profiles (person) |
| `system` | 1 | Content moderation guardrails |

Phrases are normalized: `lingo.phrase` (metadata) + `lingo.translation` (1 row per language per phrase). Adding a new language is just `INSERT` — no schema change.

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
