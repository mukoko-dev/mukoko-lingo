# Contributing to Mukoko Lingo

Thank you for your interest in contributing to Mukoko Lingo! This project is part of the [Mukoko ecosystem](https://mukoko.com) by [Nyuchi Africa](https://nyuchi.com).

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/mukoko-lingo.git`
3. Install dependencies: `npm install`
4. Copy environment variables: `cp .env.example .env.local`
5. Start the dev server: `npx expo start`

## Architecture

This is a monorepo with two apps sharing a single API layer:

| Directory | Purpose |
|-----------|---------|
| `app/` | Expo/React Native mobile app (iOS + Android) |
| `web/` | Next.js web app (browser) |
| `api/` | Shared Vercel serverless API routes |
| `lib/` | Shared business logic |
| `components/` | Mobile React Native components |

See [ARCHITECTURE.md](ARCHITECTURE.md) for the 5-layer component hierarchy.

## Development

```bash
# Mobile app
npx expo start              # Start Expo dev server
npx expo start --ios        # iOS simulator
npx expo start --android    # Android emulator

# Web app
cd web && npm install && npm run dev

# Tests
npm test                    # Run all tests
npm run test:coverage       # With coverage report

# Type checking
npx tsc --noEmit
```

## Branch Naming

- `feature/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes
- `refactor/*` — Code refactoring

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add phrase search filtering
fix: correct bookmark toggle on phrase detail
docs: update API route documentation
refactor: extract PhraseCard to L2 component
```

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commits
3. Ensure all tests pass: `npm test -- --ci`
4. Ensure TypeScript compiles: `npx tsc --noEmit`
5. Open a PR against `main`

## Code Standards

- **TypeScript** — strict mode, no `any` where avoidable
- **5-Layer Architecture** — L1 primitives → L2 domain → L3 orchestrators → L4 error boundaries → L5 pages
- **Structured logging** — use `[mukoko][module]` prefix
- **48px touch targets** — minimum for all interactive elements (mobile)
- **Five African Minerals** — use brand colors from `constants/Colors.ts` (mobile) or Tailwind config (web)

## Reporting Issues

Use the [issue templates](.github/ISSUE_TEMPLATE/) to report bugs or request features.

## License

By contributing, you agree that your contributions will be licensed under the project's license.
