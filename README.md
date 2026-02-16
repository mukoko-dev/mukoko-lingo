# Mukoko Lingo

**AI-first, skills-based multilingual language learning platform** — English, Shona, Ndebele, and Chinese.

Built with Expo SDK 54 / React Native 0.81 / React 19, MongoDB Atlas, Stytch Auth, Vercel Serverless Functions, and Anthropic Claude.

**Parent Company**: [Nyuchi Africa](https://nyuchi.com)

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Start dev server (web + mobile)
npx expo start

# Start web only
npx expo start --web
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

- `MONGODB_URI` — MongoDB Atlas connection string
- `STYTCH_PROJECT_ID` / `STYTCH_SECRET` — Stytch auth credentials
- `EXPO_PUBLIC_STYTCH_PUBLIC_TOKEN` — Stytch client-side public token
- `EXPO_PUBLIC_API_BASE_URL` — Vercel API base URL
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` — Anthropic Claude API key (AI tutor)
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway key (web API routes)

See `.env.example` for the complete list.

## Key Features

- **Daily Lessons** — Smart phrase selection (5 phrases/day) with flash cards and mini-quizzes
- **Native Phrase Learning** — 200+ phrases across 4 languages with skill-mapped progression
- **Shamwari AI Tutor** — Claude-powered tutor that adapts to learner proficiency with phrase context
- **Skills-Based Assessments** — Diagnostic, formative, and summative assessments across 5 core skills
- **Progress Dashboard** — Daily goals, streaks, skill proficiency, phrase mastery tracking
- **Admin Dashboard** — Full CRUD for phrases, skills, moderation, users, and analytics

## App Navigation

| Tab | Icon | Purpose |
|-----|------|---------|
| **Learn** | BookOpen | Daily lessons (flash cards + quiz) and phrase browsing |
| **Shamwari** | MessageCircle | AI tutor chat powered by Anthropic Claude |
| **Progress** | TrendingUp | Dashboard, bookmarks, skill proficiency, mastery tracking |
| **Profile** | User | Settings, preferences, theme, sign out |

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 54 / React Native 0.81 / React 19 |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Routing | Expo Router 6 (file-based) |
| Backend | Vercel Serverless Functions (TypeScript + Python) |
| Database | MongoDB Atlas + Prisma ORM 6 (18 models) |
| Auth | Stytch SDK 13 (email/password, OTP, magic links, WhatsApp) |
| AI | Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) |
| Testing | Jest 29 + jest-expo + React Testing Library |
| CI/CD | GitHub Actions (typecheck → test → build-web) |

## Development Commands

```bash
# Development
npx expo start              # Dev server (mobile + web)
npx expo start --web        # Web only
npx expo start --ios        # iOS dev
npx expo start --android    # Android dev

# Build & Deploy
npm run build:web           # Export web build for Vercel
npm run build:ios           # Build iOS via EAS
npm run build:android       # Build Android via EAS

# Database
npm run prisma:generate     # Generate Prisma client
npm run prisma:push         # Push schema to MongoDB
npx prisma studio           # Open Prisma Studio (GUI)

# Testing & Quality
npm test                    # Run all tests (13 suites, 188+ tests)
npm run test:coverage       # Tests with coverage report
npx tsc --noEmit            # TypeScript type check
```

## CI/CD Pipeline

GitHub Actions runs on push to `main`/`feature/*` and PRs to `main`:

1. **TypeScript Check** — `npx tsc --noEmit`
2. **Jest Tests** — `npm test -- --ci --coverage`
3. **Build Web** — `npx expo export --platform web` (depends on steps 1+2)

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Developer guide & architecture reference
- **[BRANDING.md](BRANDING.md)** — Brand guidelines & design system
- **[SECURITY.md](SECURITY.md)** — Security architecture
- **[CHANGELOG.md](CHANGELOG.md)** — Version history

## Brand

**Five African Minerals** palette:

| Color | Light | Dark | Role |
|-------|-------|------|------|
| Cobalt | `#0047AB` | `#00B0FF` | Primary |
| Tanzanite | `#4B0082` | `#B388FF` | Secondary |
| Gold | `#5D4037` | `#FFD740` | Accent |
| Army Green | `#729B63` | `#8FB47F` | Success |

## License

[MIT](LICENSE)
