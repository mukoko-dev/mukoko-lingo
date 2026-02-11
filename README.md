# Mukoko Lingo

**AI-first, skills-based multilingual language learning platform** — English, Shona, Ndebele, Swahili, Chinese.

Built with Expo/React Native (web + mobile), MongoDB Atlas, Stytch Auth, Vercel Serverless Functions, and Anthropic Claude.

## Quick Start

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Start dev server (web + mobile)
npx expo start
```

## Environment Setup

Copy `.env.example` to `.env.local` and fill in:

- `MONGODB_URI` — MongoDB Atlas connection string
- `STYTCH_PROJECT_ID` / `STYTCH_SECRET` — Stytch auth credentials
- `EXPO_PUBLIC_API_BASE_URL` — Vercel API base URL
- `EXPO_PUBLIC_ANTHROPIC_API_KEY` — Anthropic Claude key (mobile AI tutor)
- `AI_GATEWAY_API_KEY` — Vercel AI Gateway key (web API routes)

See `.env.example` for the complete list.

## Key Features

- **Native Phrase Learning** — 200+ phrases across 5 languages with skill-mapped progression
- **Shamwari AI Tutor** — Anthropic Claude-powered tutor that adapts to learner proficiency
- **Skills-Based Assessments** — Diagnostic, formative, and summative assessments across 5 core skills
- **User Insights Dashboard** — Bookmarks, phrase mastery, skill proficiency, study analytics
- **Admin Content Management** — Full CRUD for phrases, categories, skills, moderation, and users

## Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | Expo / React Native (web + iOS + Android) |
| Backend | Vercel Serverless Functions |
| Database | MongoDB Atlas + Prisma ORM |
| Auth | Stytch (email/password, OTP, magic links) |
| AI | Anthropic Claude via Vercel AI Gateway |

## Development Commands

```bash
npx expo start              # Dev server (mobile + web)
npx expo start --web        # Web only
npm run build:web           # Export web build for Vercel
npm run prisma:generate     # Generate Prisma client
npm run prisma:push         # Push schema to MongoDB
npm test                    # Run all tests
npx tsc --noEmit            # TypeScript type check
```

## Documentation

- **[CLAUDE.md](CLAUDE.md)** — Developer guide & architecture reference
- **[BRANDING.md](BRANDING.md)** — Brand guidelines & design system
- **[DEPLOYMENT.md](DEPLOYMENT.md)** — Deployment guide (Vercel + MongoDB Atlas)
- **[SECURITY.md](SECURITY.md)** — Security architecture
- **[CHANGELOG.md](CHANGELOG.md)** — Version history
- **[DEV_MODE.md](DEV_MODE.md)** — Development mode setup

## Brand

**Five African Minerals** palette:

| Color | Light | Dark | Role |
|-------|-------|------|------|
| Cobalt | `#0047AB` | `#00B0FF` | Primary |
| Tanzanite | `#4B0082` | `#B388FF` | Secondary |
| Gold | `#5D4037` | `#FFD740` | Accent |
| Army Green | `#729B63` | `#8FB47F` | Success |

## Project Status

**Version**: 3.1.0 (February 2026)
**Status**: Active development
**Parent Company**: Nyuchi Africa (nyuchi.com)

## License

[MIT](LICENSE)
