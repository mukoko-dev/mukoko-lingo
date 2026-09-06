# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mukoko Lingo is an AI-first, skills-based multilingual language learning platform** (English, Shona, Ndebele, Chinese) with both web and mobile (Expo/React Native) applications, powered by MongoDB, WorkOS AuthKit, Vercel Serverless Functions, and Cloudflare Workers AI.

**Parent Company**: Nyuchi Africa (nyuchi.com)

### Core Philosophy

**Phrase Learning is Primary**: The app's main purpose is to enable learners to become multilingual through native language phrase learning. AI serves as an intelligent tutor that supports and enhances the learning process, not replaces it.

**Skills-Based Progression**: Learning is organized around proficiency skills that naturally progress through assessments:
- **Skills** → Drive the learning structure (5 core skills in the database)
- **Categories** → Organized by skill level
- **Phrases** → Mapped to specific skill proficiencies
- **Assessments** → Measure skill mastery and unlock progression
- **Shamwari AI** → Adapts teaching based on demonstrated proficiency

### Shamwari - The AI Mascot

**Shamwari** (meaning "friend" in Shona) is the friendly AI language tutor mascot of Mukoko Lingo. Shamwari is:
- **Who users interact with**: All AI conversations are with Shamwari
- **Personality**: Warm, patient, encouraging, playful but professional
- **Voice**: Friendly but knowledgeable, like a supportive teacher
- **Mascot file**: `/assets/images/icon.png` (app icon)

When implementing AI features, the AI should:
- Introduce itself as "Shamwari"
- Use occasional hive/friend references naturally
- Be warm and personable while maintaining educational quality

### Key Features
1. **Native Phrase Learning** - Core learning experience focused on practical phrases with language selector
2. **Shamwari AI Tutoring** - AI powered by Cloudflare Workers AI (`@cf/qwen/qwen3-30b-a3b-fp8`), adapts to learner's proficiency level
3. **Skills-Based Assessments** - Assessment engine with question bank, diagnostic and skill-specific tests
4. **User Insights Dashboard** - Bookmarks, phrase mastery tracking, skill proficiency, study analytics
5. **Progressive Learning Path** - Skills naturally unlock as proficiency grows
6. **Content Moderation** - Local guardrails + AI-based moderation for safe learning
7. **Admin Content Management** - Manage phrases, categories, skills, and moderation (mobile + web)
8. **Python Analytics** - PostgreSQL aggregation pipelines for advanced admin analytics

## Development Commands

```bash
# Development
npx expo start           # Start Expo dev server (mobile + web)
npx expo start --web     # Start web dev server only
npx expo start --ios     # Start iOS dev
npx expo start --android # Start Android dev

# Build & Deploy
npm run build:web        # Export web build for Vercel
npm run build:ios        # Build iOS via EAS
npm run build:android    # Build Android via EAS
npm run build:all        # Build all platforms via EAS

# Database (MongoDB)
# Schemaless; indexes managed via scripts/create-indexes.ts
# Key collections: identity.persons (shared), learner_profiles, phrases, phrase_progress, skills, classes, guardrails

# Testing
npm test                 # Run all tests (Jest + jest-expo)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Code Quality
npx tsc --noEmit         # TypeScript type checking
npm run lint             # ESLint
node scripts/docs/check-docs.js   # Documentation drift check (also runs in CI)

# Release (automated — see RELEASES.md)
npm run release:dry      # What a merge to main would tag, writing nothing
```

## Environment Setup

**Required Environment Variables** (see `.env.example` for full template):

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/lingo

# WorkOS AuthKit (server-side only - NEVER expose to client)
WORKOS_API_KEY=sk_test_your-workos-api-key
WORKOS_CLIENT_ID=client_your-workos-client-id

# WorkOS redirect URIs (registered in the WorkOS dashboard)
WORKOS_REDIRECT_URI_WEB=https://lingo.mukoko.com/auth/callback
WORKOS_REDIRECT_URI_MOBILE=mukokolingo://auth/callback

# WorkOS (client-side - Client ID is not secret)
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_your-workos-client-id
EXPO_PUBLIC_WORKOS_REDIRECT_URI=mukokolingo://auth/callback

# API Base URL (Vercel serverless functions)
EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.vercel.app

# Cloudflare Workers AI, via Cloudflare AI Gateway (SERVER-SIDE ONLY —
# proxied via /api/ai/chat). Model: @cf/qwen/qwen3-30b-a3b-fp8
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_API_TOKEN=your_cloudflare_api_token
CLOUDFLARE_AI_GATEWAY_ID=your_gateway_id
# CLOUDFLARE_AI_GATEWAY_TOKEN=  # only for an authenticated gateway
# WORKERS_AI_MODEL=@cf/qwen/qwen3-30b-a3b-fp8  # model override
```

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your MongoDB connection string
3. Fill in your WorkOS API key and Client ID from https://dashboard.workos.com
4. Run `npx expo start` to start the dev server

## Directory Structure

```
nyuchi-lingo/
├── app/                          # Expo Router pages (web + mobile)
│   ├── (tabs)/                   # Tabbed navigation (5 tabs)
│   │   ├── index.tsx             # Browse Phrases (main learning)
│   │   ├── ai-practice.tsx       # Shamwari AI tutor chat
│   │   ├── insights.tsx          # Bookmarks, mastery, analytics
│   │   ├── skills.tsx            # Skills breakdown + assessments
│   │   ├── profile.tsx           # User settings & preferences
│   │   └── _layout.tsx           # Tab navigation layout
│   ├── admin/                    # Admin dashboard
│   │   ├── overview/             # Stats dashboard
│   │   ├── users/                # User management
│   │   ├── phrases/              # Phrase CRUD
│   │   ├── skills/               # Skills management
│   │   ├── standards/            # Learning standards editor
│   │   ├── guardrails/           # Content moderation rules
│   │   ├── moderation/           # Review flagged content
│   │   ├── analytics/            # Activity analytics
│   │   ├── index.tsx             # Admin home
│   │   └── _layout.tsx           # Admin layout + access check
│   ├── auth/                     # Authentication pages
│   │   ├── index.tsx             # Sign in/signup
│   │   ├── callback.tsx          # OAuth/magic link callback
│   │   ├── forgot-password.tsx   # Password reset request
│   │   └── reset-password.tsx    # Password reset form
│   ├── assessment/[skill].tsx    # Skill assessment page
│   ├── phrase/[id].tsx           # Phrase detail page
│   ├── onboarding/index.tsx      # Onboarding flow
│   ├── welcome/index.tsx         # Landing page
│   ├── about/index.tsx           # About page
│   ├── features/index.tsx        # Feature showcase
│   ├── why/index.tsx             # Benefits page
│   ├── legal/                    # Terms & privacy
│   ├── _layout.tsx               # Root layout (auth context, theme)
│   ├── +html.tsx                 # Web HTML wrapper
│   ├── +not-found.tsx            # 404 page
│   └── modal.tsx                 # Modal handling
│
├── api/                          # Vercel Serverless Functions (backend)
│   ├── _lib/                     # Shared middleware
│   │   ├── auth-middleware.ts    # WorkOS access-token validation + admin check
│   │   ├── ai-provider.ts        # Workers AI transport + circuit breaker
│   │   ├── tutor-prompt.ts       # Server-side system prompt + score clamping
│   │   ├── chat-input.ts         # Chat body validation (rejects `system` role)
│   │   ├── moderation.ts         # Server-side guardrails + moderation_alerts
│   │   ├── mongo.ts              # Mongo client + collection accessors re-export shim
│   │   └── cors.ts               # CORS configuration
│   ├── auth/                     # Auth endpoints (login, register, OTP, magic links, WhatsApp)
│   ├── phrases/                  # Phrase CRUD
│   ├── bookmarks/                # Bookmark management
│   ├── profiles/                 # User profile CRUD
│   ├── skills/                   # Skills data endpoints
│   ├── assessments/              # Assessment endpoints
│   ├── progress/                 # Progress tracking
│   ├── study-sessions/           # Study session recording
│   ├── ai/conversations/         # AI chat conversation + message storage
│   ├── admin/                    # Admin-only endpoints (requires admin role)
│   │   ├── phrases/              # Phrase management
│   │   ├── users/[id]/           # User role + status management
│   │   ├── standards/            # Learning standards CRUD
│   │   ├── guardrails/           # Content moderation rules
│   │   ├── moderation/           # Review flagged content
│   │   ├── skills/               # Skill management
│   │   ├── stats.ts              # Dashboard statistics
│   │   ├── activity.ts           # Activity logs
│   │   └── popular-phrases.ts    # Most viewed phrases
│   └── analytics/                # Python analytics (PostgreSQL aggregation — migration pending)
│       ├── _helpers.py           # Shared DB + auth utilities
│       ├── overview.py           # Growth rates, user funnel, trends
│       ├── learning-velocity.py  # Learning speed metrics
│       ├── skill-distribution.py # Skill distribution analytics
│       └── engagement.py         # User engagement metrics
│
├── lib/                          # Core libraries
│   ├── ai/                       # AI integration
│   │   ├── chat-service.ts       # Client for /api/ai/chat (sends proficiency)
│   │   ├── prompt-builder.ts     # Pure prompt template (shared with the API)
│   │   ├── guardrail-rules.ts    # Guardrail pattern definitions
│   │   ├── skills-aware-prompts.ts # Client-side proficiency helpers
│   │   └── moderation.ts         # Client-side pre-check (not the boundary)
│   ├── auth/
│   │   └── workos-client.ts      # WorkOS AuthKit client (PKCE hosted sign-in)
│   ├── db/
│   │   ├── mongo.ts              # MongoDB client singleton
│   │   ├── collections.ts        # Typed per-collection accessors
│   │   ├── types.ts              # Collection document interfaces
│   │   └── phrase-shape.ts       # Flat phrase ↔ API camelCase shape mapping
│   ├── data/
│   │   ├── phrases-data.ts       # 200+ phrases in 4 languages
│   │   ├── assessment-questions.ts # Question bank across 5 skills
│   │   └── translations.ts       # UI translations (EN, Shona, Ndebele, Chinese)
│   ├── hooks/
│   │   ├── useAdmin.ts           # Admin role checking (client-side via API)
│   │   ├── useLearningLanguage.tsx # Learning language state (AsyncStorage)
│   │   └── useTheme.tsx          # Theme management (light/dark/system)
│   ├── services/
│   │   └── api-client.ts         # REST API client with WorkOS Bearer token
│   ├── storage/
│   │   ├── database.d.ts         # Platform-agnostic storage interface
│   │   ├── database.web.ts       # AsyncStorage implementation (web)
│   │   └── database.native.ts    # SQLite implementation (iOS/Android)
│   ├── workos/
│   │   └── config.ts             # WorkOS AuthKit redirect URI configuration
│   └── types/
│       └── skills.ts             # Skills system TypeScript definitions
│
├── components/                   # Reusable React Native components
│   ├── AppHeader.tsx             # Navigation header
│   ├── Themed.tsx                # Theme-aware View/Text components
│   ├── StyledText.tsx            # Styled text component
│   ├── ExternalLink.tsx          # External link wrapper
│   ├── EditScreenInfo.tsx        # Debug info component
│   ├── useColorScheme.ts        # Platform-specific theme hooks
│   └── useClientOnlyValue.ts    # SSR-safe value hooks
│
├── constants/
│   └── Colors.ts                 # Five African Minerals brand palette
│
├── web/                          # Next.js web app (browser experience)
│   ├── app/                      # Next.js App Router pages
│   ├── components/               # Web components (L1-L5 architecture)
│   └── lib/                      # Web-specific utilities + full API client
│
├── assets/                       # App icons, splash screens, images
├── public/                       # Static web assets
├── scripts/                      # DB scripts, release + docs automation
│   ├── release/                  # Version derivation, changelog surgery, CLI
│   └── docs/check-docs.js        # Documentation drift check (CI job)
├── docs/                         # Technical documentation
├── .github/workflows/
│   ├── ci.yml                    # lint → typecheck → test → docs → builds
│   └── release.yml               # Auto-tag + GitHub Release after green CI
└── .claude/agents/               # Custom Claude Code agent definitions
```

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Expo SDK 57 / React Native 0.86 / React 19 (web + iOS + Android) |
| Styling | NativeWind (Tailwind CSS for React Native) |
| Routing | Expo Router 6 (file-based routing) |
| Backend | Vercel Serverless Functions (TypeScript + Python) |
| Database | MongoDB (database `lingo` — shared with the rest of the Nyuchi ecosystem) |
| Auth | WorkOS AuthKit (hosted sign-in, PKCE authorization-code flow) |
| AI | Cloudflare Workers AI — Qwen3 30B A3B, via Cloudflare AI Gateway |
| Testing | Jest 29 + jest-expo + React Testing Library |
| CI/CD | GitHub Actions — CI (lint, typecheck, test, docs, builds) → Release (auto-tag) |

### Authentication System

**Architecture:**
- **WorkOS AuthKit** hosted sign-in page (email/password, magic auth, social —
  whatever the AuthKit environment has enabled) via the PKCE
  authorization-code flow
  - Client: `lib/auth/workos-client.ts` - drives the flow via
    `expo-web-browser`'s `openAuthSessionAsync`, persists tokens with secure
    storage
  - Server: `api/_lib/auth-middleware.ts` - Vercel API auth middleware
  - Access/refresh tokens stored via SecureStore (native) or AsyncStorage (web)
- **Vercel Serverless Functions** - access tokens verified locally against
  WorkOS's JWKS (`jose`), no per-request round trip for signature/expiry checks

**Flow**: Client opens the AuthKit hosted URL → WorkOS redirects back with an
authorization code → client exchanges it (with its PKCE verifier) for an
access/refresh token pair via `/api/auth/callback` → subsequent API requests
send the access token as a `Bearer` header → an `identity.persons` document is
found-or-created (keyed on `workosUserId`, see `lib/db/identity.ts`) if new user

**Auth API Routes** (`api/auth/`):
- `authorize.ts` - builds the AuthKit hosted sign-in URL + PKCE verifier
- `callback.ts` - exchanges the authorization code for tokens
- `refresh.ts` - exchanges a refresh token for a new access token
- `session/validate.ts` - validates an access token
- `logout.ts` - best-effort session revocation

**Key Files**:
- `lib/auth/workos-client.ts` - Client-side auth
- `api/_lib/auth-middleware.ts` - Server-side auth validation + admin checks
- `lib/services/api-client.ts` - REST API client with auth headers

### Database Schema (MongoDB)

**Database**: `lingo` — the real, shared Nyuchi ecosystem database, accessed via `lib/db/mongo.ts` (client singleton, `getDb(name?)`, `DB_NAME = 'lingo'`) and `lib/db/collections.ts` (typed per-collection accessors). Schemaless — indexes are created via `scripts/create-indexes.ts`. **Never `mukoko-lingo`** — that was an invented, never-populated database from the original Supabase migration; `lingo` already holds the real, ecosystem-curated `phrases`/`languages`/`scenarios`/`standards`/`learningStandards` content (see `docs/ECOSYSTEM_DATA_MIGRATION.md`), and Lingo's own operational collections (bookmarks, progress, profiles, etc.) live there too. The MongoDB cluster is **shared across the Nyuchi ecosystem** — `identity`, `entity`, `lingo`, `engagement`, etc. are sibling databases on the same cluster, each owned by a different domain/app. Lingo must never invent its own parallel user table; it reads/writes the shared `identity` database for user identity (see below).

**User & Authentication** — split across two databases, merged at the API layer (`lib/db/identity.ts`):
- `identity.persons` (shared, ecosystem-wide, **not Lingo-owned**) — the real user record: UUID string `_id` (used as the OIDC `sub` claim), OIDC standard claims (`email`, `givenName`, `familyName`, `name`, `locale`, etc.), `workosUserId` mapping to WorkOS. Other Nyuchi apps (identity, entity, ubuntu, etc.) read and write this same collection.
- `lingo.learner_profiles` (Lingo-local) — the extension fields the shared schema has no room for: `role` (`user`/`admin`), `status`, `preferred_ui_language`, `learning_goal`, `daily_goal`, push token, streaks. Keyed on `person_id` (== `identity.persons._id`).
- `lib/db/identity.ts` exports the only sanctioned way to touch either collection: `findOrCreatePersonFromWorkOS`, `getMergedProfile`, `updateLingoProfile`, `listMergedProfiles`, etc. — all API routes go through these rather than querying `persons()`/`lingoProfiles()` directly, so the two collections never drift out of sync.

**Phrase Learning**:
- `phrases` - 200+ phrases, one flat document per phrase carrying all language fields directly (`english`, `shona`, `ndebele`, `swahili`, `chinese` + nested `pronunciation`/`context`). Mapped to skills via `skill_id` and `required_proficiency`. Seeded from `lib/data/phrases-data.ts` via `scripts/seed-phrases.ts`
- `phrase_progress` - Learning status tracking (`learning`/`practiced`/`mastered`)
- `bookmarks` - User-saved phrases for review (its own collection, not a flag on `phrase_progress`)
- `phrase_views` - View tracking analytics
- `study_sessions` - Daily study session metrics

**Skills-Based Learning**:
- `skills` - 5 core skills (pronunciation, vocabulary, grammar, comprehension, conversation) with i18n display names, plus an embedded `levels` array (5 proficiency levels, beginner → fluent)
- `user_skills` - Current user proficiency per skill (score 0-100, read by AI tutor)
- `assessments` - Assessment templates (diagnostic/formative/summative) with questions JSON
- `user_assessments` - User test results with answers, score, pass/fail
- `learning_standards` - AI tutor configuration by proficiency level

**AI & Moderation**:
- `ai_conversations` - Chat sessions with type and language, messages embedded directly (capped ~200/conversation)
- `moderation_alerts` - Flagged content for admin review (pending/reviewed/resolved)
- `guardrails` - Content moderation rules (6 categories: content/behavior/safety)

**Access Control**: API routes enforce auth via WorkOS access-token validation. Admin routes check `profile.role === 'admin'` in `requireAdmin()` middleware.

### Skills-Based Learning System

**Core Principle**: Learning progression is driven by demonstrated proficiency in specific skills, not just time or phrase count.

**Learning Flow**:
1. **Initial Assessment** → Determine baseline proficiency in each skill
2. **Phrase Learning** → Practice phrases appropriate to current skill level
3. **AI Tutoring** → Get contextual help from AI tutor adapted to proficiency
4. **Skill Assessment** → Periodically test skill mastery
5. **Progressive Unlock** → Access higher-level content as skills improve

**Proficiency Levels** (from `scoreToLevel()` in `lib/ai/skills-aware-prompts.ts`):
| Level | Score Range | Description |
|-------|-----------|-------------|
| Beginner | 0-49 | Basic phrases, simple grammar, maximum AI support |
| Elementary | 50-64 | Common expressions, guided practice, high support |
| Intermediate | 65-79 | Conversational fluency, moderate scaffolding |
| Advanced | 80-89 | Complex phrases, nuanced language, light support |
| Fluent | 90-100 | Native-like proficiency, peer conversation |

**Skills Taxonomy** (implemented in DB):
- **Pronunciation** - Sound production, tone, rhythm
- **Vocabulary** - Word knowledge, context usage
- **Grammar** - Sentence structure, verb forms, particles
- **Comprehension** - Listening and reading understanding
- **Conversation** - Real-time dialogue, cultural context

**Assessment Types** (in `assessments` collection):
- **Diagnostic** - Initial skill level determination
- **Formative** - Ongoing progress checks during learning
- **Summative** - Skill mastery verification before unlock

### AI Integration (AI-First Architecture)

**Philosophy**: Mukoko Lingo is an AI-first application. The AI tutor reads user proficiency for every interaction to provide adaptive, personalized teaching.

**Inference** — one provider, server-side only. Clients never hold a
credential; everything goes through `/api/ai/chat` and `/api/ai/moderate`.

- **Provider**: Cloudflare Workers AI, reached through Cloudflare AI Gateway
- **Model**: `@cf/qwen/qwen3-30b-a3b-fp8` (MoE, ~3B active params per pass —
  fast enough for a tutor turn, strong multilingual coverage). Override with
  `WORKERS_AI_MODEL` — a deploy variable, not a code change.
- **Client fallback**: `lib/ai/chat-service.ts` returns simulated responses
  when the route reports the service unconfigured (demo/offline mode)

**Transport** (`api/_lib/ai-provider.ts`):
- `POST https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`
  with `Authorization: Bearer {CLOUDFLARE_API_TOKEN}` and
  `cf-aig-gateway-id: {CLOUDFLARE_AI_GATEWAY_ID}`. Add
  `CLOUDFLARE_AI_GATEWAY_TOKEN` only for a gateway set to "authenticated".
- The endpoint is **OpenAI-compatible**: the system prompt is a leading
  `system` message (not a top-level field), and the answer comes back on
  `choices[0].message.content`.
- `CLOUDFLARE_AI_GATEWAY_ID` is optional. Unset, requests still reach Workers
  AI — they just bypass the gateway, losing caching, per-gateway rate limits
  and the request log. An empty `cf-aig-gateway-id` header is never sent;
  Cloudflare rejects it.
- Circuit breaker: 3 failures / 5 min cooldown, then one probe. With a single
  provider it no longer protects a sibling candidate — it fails fast during an
  outage instead of making every learner wait out the 15s timeout.
- `AiNotConfiguredError` (no credential) and `AiUnavailableError` (the call
  failed) are distinct — `/api/ai/moderate` relies on that to avoid silently
  passing all content when moderation breaks. Its responses carry
  `ai_checked`; set `AI_MODERATION_FAIL_CLOSED=true` to 503 instead of falling
  back to local guardrails.
- **Neither Anthropic nor the Vercel AI Gateway is used any more.** Both
  transports, both credentials (`ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`) and
  the per-language Kimi routing were removed; `language` and
  `conversation_type` now shape only the system prompt, never provider choice.

**Core AI System** — the system prompt is built **server-side**. A caller
cannot supply, extend, or replace it; `/api/ai/chat` ignores any
`system_prompt` in the request body.

- `lib/ai/prompt-builder.ts` — pure template, no React Native imports so the
  serverless bundle can load it. Owns `normalizeLanguage`,
  `normalizeConversationType`, `scoreToLevel`, `toProficiencyMap` and the
  standing `INJECTION_RESISTANCE` block.
- `api/_lib/tutor-prompt.ts` — `buildSystemPromptForUser({ personId, language,
  conversationType, clientScores })`, called for EVERY AI interaction.
- `lib/ai/skills-aware-prompts.ts` — client-side helpers (`scoreToLevel`,
  conversation starters). It no longer builds the prompt that reaches a model.

The prompt is assembled from:
  - User proficiency profile (overall + individual skills)
  - Vocabulary complexity guidance (simple → native-level)
  - Grammar complexity guidance (present simple → full grammatical range)
  - Scaffolding level (maximum support → peer conversation)
  - Error correction approach (correct everything → no corrections)
  - Conversation type specific guidance (practice/scenario/translation_help)

**Only two request fields influence it**, and both go through allowlists:
`language` and `conversation_type`. Anything unrecognised falls back to a
known constant rather than reaching the template.

**Proficiency resolution order** (`api/_lib/tutor-prompt.ts`):
1. `lingo.user_skills` for this person — authoritative when present.
2. Otherwise the request's `proficiency` map, passed through
   `sanitizeClientScores` (five known skill names, finite numbers only) and
   then `toProficiencyMap` (clamped 0–100).
3. Otherwise beginner defaults.

Step 2 exists because practice, mini-quizzes and assessments record scores
into **device storage** via `updateUserSkill`, and nothing syncs them to
`lingo.user_skills` — which is empty. Without it the tutor scaffolds every
learner as an absolute beginner. Only *numbers* cross this boundary, and they
only select which fixed guidance string the template uses, so it does not
reopen the injection surface that removing `system_prompt` closed. It
self-corrects once `user_skills` is populated.

**Request validation** (`api/_lib/chat-input.ts`): `sanitizeChatMessages`
rejects a client-supplied `system` role (which the provider would read as
instructions), rejects non-string content and unknown roles, caps the history
at `MAX_MESSAGES` turns of `MAX_CONTENT_CHARS`, and guarantees the array opens
on a user turn.

**Content Moderation** — runs **server-side** in `api/_lib/moderation.ts`.
`lib/ai/moderation.ts` still runs in the client bundle, but it only protects
users who go through the UI; posting straight to the route bypasses it.

- `/api/ai/chat` moderates **every turn** in the submitted history, not just
  the newest — a payload can sit in an earlier turn, or in a forged
  `assistant` turn, and still reach the model. Guardrails are local regex, so
  scanning the whole array costs nothing extra.
- Local guardrails (pattern/keyword matching against `guardrails` collection)
- AI-based moderation via the same Workers AI model for nuanced content
- 6 core categories: sexual content, hate speech, harassment, violence, self-harm, misinformation
- Flagged content creates `moderation_alerts` (UUID `_id`) for admin review
- A blocked request returns 400 with `moderated: true` and the guardrail
  reason, which the client surfaces instead of a generic network error

**AI Message Storage** (`api/ai/conversations/`):
- `POST /api/ai/conversations` - Create conversation
- `GET /api/ai/conversations/:id/messages` - Get messages
- `POST /api/ai/conversations/:id/messages` - Store message

**Conversation Starters**: `getConversationStarters(language)` in `chat-service.ts` provides language-specific starting prompts.

### Navigation System

**Mobile Tab Navigation** (`app/(tabs)/_layout.tsx`):
1. **Learn** (`index.tsx`) - Daily lesson (flash cards + quiz) and phrase browsing with language selector, search, category filters
2. **Shamwari** (`ai-practice.tsx`) - AI chat tutor powered by Workers AI, accepts phrase context from Learn/Phrase screens
3. **Progress** (`insights.tsx`) - Dashboard (daily goal, streak, skill proficiency, phrase mastery) + Phrases (bookmarked/tracked phrases)
4. **Profile** (`profile.tsx`) - User settings and preferences

**Other Routes**:
- `app/assessment/[skill].tsx` - Skill assessment page
- `app/phrase/[id].tsx` - Phrase detail page
- `app/onboarding/index.tsx` - New user onboarding
- `app/welcome/`, `app/about/`, `app/features/`, `app/why/` - Public/marketing pages
- `app/auth/` - Authentication flow (sign in, callback, password reset)
- `app/legal/` - Terms and privacy pages

### Admin System

**Access Control**:
- Server-side: `requireAdmin()` from `api/_lib/auth-middleware.ts` validates the WorkOS access token + admin role
- Client-side: `useAdmin()` hook from `lib/hooks/useAdmin.ts` checks role via profiles API

**Admin Routes** (`app/admin/`):
- `overview/` - Statistics dashboard (users, phrases, views, bookmarks)
- `users/` - User management with role toggling and status changes
- `phrases/` - Phrase CRUD with category/difficulty filters
- `skills/` - Skills management (toggle active, view levels)
- `standards/` - Learning standards editor
- `guardrails/` - Content moderation rules (6 core categories)
- `moderation/` - Review flagged content queue
- `analytics/` - Activity analytics and monitoring

**Admin Features**:
- Admin access check in `app/admin/_layout.tsx`
- All data fetched from MongoDB via API (no hardcoded data)
- Pull-to-refresh on admin screens
- Confirmation dialogs for destructive actions

**Admin API Routes** (`api/admin/`):
- `stats.ts` - Dashboard statistics
- `activity.ts` - Activity logs
- `popular-phrases.ts` - Most viewed phrases
- `users/[id]/role.ts` - Change user roles
- `users/[id]/status.ts` - Suspend/activate users
- `phrases/` - Phrase CRUD
- `standards/` - Learning standards CRUD
- `guardrails/` - Guardrail CRUD
- `moderation/` - Review moderation alerts
- `skills/[id].ts` - Skill management

**Python Analytics** (`api/analytics/`):
- `overview.py` - Growth rates, user funnel, activity trends
- `learning-velocity.py` - Learning speed metrics
- `skill-distribution.py` - Skill proficiency distribution
- `engagement.py` - User engagement metrics
- `_helpers.py` - Shared DB connection + admin verification
- Uses pymongo for aggregation pipelines (migration to psycopg2 pending)
- All require admin authentication

## Design System & Colors

### Five African Minerals Palette

Colors are defined in `constants/Colors.ts` and consumed via `lightTheme` / `darkTheme` objects.

| Color | Light Hex | Dark Hex | Usage |
|-------|-----------|----------|-------|
| **Cobalt (Primary)** | `#0047AB` | `#00B0FF` | Main CTAs, primary actions, trust |
| **Tanzanite (Secondary)** | `#4B0082` | `#B388FF` | Depth, creativity, secondary actions |
| **Gold (Accent)** | `#5D4037` | `#FFD740` | Achievement, warmth, premium |
| **Army Green (Success)** | `#729B63` | `#8FB47F` | Mastery, progress, success states |

### Background Colors
- **Light Theme**: `#FAF9F5` (Warm Cream)
- **Dark Theme**: `#0A0A0A` (Charcoal base)
- **Cards**: `#FFFFFF` (light) / `#141414` (dark)
- **Surface**: `#F3F2EE` (light) / `#1E1E1E` (dark elevated)

### Text Colors
- **Primary**: `#141413` (light) / `#F5F5F4` (dark)
- **Secondary**: `#52524E` (light) / `#A8A8A3` (dark)
- **Muted**: `#8C8B87` (light) / `#6B6B66` (dark)

### Usage in Code

```typescript
import { Colors, lightTheme, darkTheme } from '@/constants/Colors'

// Use theme objects for semantic colors
const theme = isDark ? darkTheme : lightTheme
style={{ backgroundColor: theme.primary }}  // #0047AB or #00B0FF

// Use Colors directly for specific shades
style={{ backgroundColor: Colors.primary[600] }}  // Always #0047AB
```

All styling uses React Native `StyleSheet` + NativeWind (Tailwind CSS for React Native).

See [BRANDING.md](BRANDING.md) for complete brand guidelines.

## Data Fetching Patterns

### API Client (All data flows through REST API)

All client-side data operations go through `lib/services/api-client.ts` which automatically includes the WorkOS Bearer token:

```typescript
import { phrasesApi, bookmarksApi, profilesApi, skillsApi, assessmentsApi } from '@/lib/services/api-client'

// Fetch data (auth token automatically included)
const { data: phrases } = await phrasesApi.listPhrases({ category: 'greetings' })
const { data: bookmarks } = await bookmarksApi.listBookmarks()
const { data: profile } = await profilesApi.getMyProfile()
const { data: skills } = await skillsApi.listSkills()
const { data: userSkills } = await skillsApi.getUserSkills()
```

**Available API namespaces**: `profilesApi`, `phrasesApi`, `bookmarksApi`, `progressApi`, `skillsApi`, `assessmentsApi`, `standardsApi`, `moderationApi`, `guardrailsApi`, `aiApi`, `adminStatsApi`, `analyticsApi`

### Server-Side (Vercel API Routes)

```typescript
// In api/ serverless functions - use the Mongo collection accessors
import { phrases } from '../_lib/mongo'
import { requireAuth, requireAdmin } from '../_lib/auth-middleware'

const user = await requireAuth(req)      // Returns AuthenticatedUser with personId (Mongo _id string)
const admin = await requireAdmin(req)    // Also checks admin role
const col = await phrases()
const data = await col.find({ category: 'greetings' }).toArray()
```

### Local Storage (Mobile)

Proficiency is recorded locally — practice, mini-quizzes and assessments all
write through `updateUserSkill`, and nothing syncs it to `lingo.user_skills`:

```typescript
import { getUserSkills } from '@/lib/storage/database'
// Platform-agnostic: AsyncStorage (web) or SQLite (native)
```

`lib/ai/chat-service.ts` sends these scores to `/api/ai/chat` as a numeric
`proficiency` map so the server-built prompt can adapt. The server clamps
them and prefers `lingo.user_skills` whenever that collection has a row for
the user. **Do not send prompt text from the client** — the prompt itself is
built server-side (see AI Integration above).

## Database Schema Management

**Schema Management**: MongoDB is schemaless; indexes are created via `scripts/create-indexes.ts`.

## Testing Infrastructure

- **Framework**: Jest 29 with jest-expo preset, React Testing Library
- **CI pipeline**: GitHub Actions runs lint, TypeScript check, tests, the docs
  drift check and both builds on pushes to `main`/`feature/*` and on every PR
- **Coverage**: Tracked via `jest --coverage`, collected from `lib/**` and
  `components/**` — `api/**` and `scripts/**` tests run but do **not** count
  toward the thresholds, so the backend has no coverage floor

**Test Suites** (42 suites, 469 tests). Run `npx jest --listTests` for the
current set; the security-relevant ones are worth knowing by name:

*Backend (`api/**`)* — note these are **not** included in
`collectCoverageFrom`, so they do not move the coverage thresholds:
- `api/_lib/__tests__/auth-middleware.test.ts` - Token verification; that
  `allowExpired` widens expiry **only** and never rescues a bad signature
- `api/_lib/__tests__/chat-input.test.ts` - Rejects a client `system` role,
  unknown roles, non-string content; leading-turn rule
- `api/_lib/__tests__/tutor-prompt.test.ts` - Prompt built from stored
  proficiency; client scores clamped; hostile input ignored
- `api/ai/chat/__tests__/chat-route.test.ts` - Every turn moderated (not just
  the newest), forged `assistant` turns labelled, `max_tokens` clamped
- `api/_lib/__tests__/ai-provider.test.ts` - Workers AI wiring (gateway headers,
  OpenAI shape), the two-part config gate, circuit breaker
- `api/_lib/__tests__/moderation.test.ts` - Server-side guardrails + alert writes
- `api/ai/__tests__/moderate-json.test.ts` - Verdict extraction survives a
  reasoning model's `<think>` block (a bad match fails open, silently dropping
  the AI moderation pass)
- `api/_lib/__tests__/jose-cjs.test.ts` - Guards the jose v6 ESM/CJS auth outage

*Shared (`lib/**`)*:
- `lib/ai/__tests__/prompt-injection.test.ts` - Allowlists hold against
  injection strings; no caller text reaches the prompt
- `lib/workos/__tests__/config.test.ts` - Redirect allowlist, including the
  private-LAN range boundary and the production Vercel alias
- `lib/ai/__tests__/chat-service.test.ts` - Chat client + moderation integration
- `lib/ai/__tests__/moderation.test.ts` - Client-side pre-check
- `lib/auth/__tests__/workos-client.test.ts` / `.native.test.ts` - AuthKit flow, per platform
- `lib/data/__tests__/*` - Phrase, question bank and translation integrity
- `lib/db/__tests__/*-shape.test.ts` - Document ↔ API shape mapping
- `lib/services/__tests__/*` - API client, SRS, XP, daily lesson
- `lib/storage/__tests__/database.test.ts` - Bookmarks, progress, skills, sessions
- `lib/hooks/__tests__/*` - Language, theme and UI-language hooks
- `components/__tests__/*` - Flash card, mini quiz, daily lesson, celebration

*Tooling (`scripts/**`)* — these guard the automation, not the app:
- `scripts/release/__tests__/version.test.js` - Which commit types release, and
  that a pre-1.0 breaking change stays inside 0.x
- `scripts/release/__tests__/changelog.test.js` - `[Unreleased]` moves under a
  version heading without disturbing published sections; an empty section
  cannot produce a hollow release
- `scripts/release/__tests__/version-files.test.js` - Each version transform
  runs against the **real** project files, so a reformat that breaks a marker
  fails in the PR rather than mid-release
- `scripts/docs/__tests__/check-docs.test.js` - The drift checker catches real
  drift without crying wolf over a legitimate `mukoko-lingo` slug or hostname

**Mocking `api/**` modules in tests**: Babel hoists `import` above the
`const mockX = jest.fn()` declarations, so a `jest.mock` factory that captures
those bindings directly reads them in their temporal dead zone and silently
yields `undefined` exports. Have the factory delegate instead —
`someExport: (...a) => mockSomeExport(...a)` — and include `__esModule: true`.
Modules that read `process.env` into consts at import time (e.g.
`auth-middleware`) need `jest.isolateModules` + `require` after the env is set.

## CI/CD Pipeline

### CI (`.github/workflows/ci.yml`)

**Triggers**: push to `main` or `feature/*`, and every pull request to `main`.

| Job | What it runs |
|---|---|
| `lint` | `npm run lint` (mobile) |
| `typecheck` | `npx tsc --noEmit` |
| `test` | `npm test -- --ci --coverage`, uploads `coverage/` (7 days) |
| `docs` | `node scripts/docs/check-docs.js` — dependency-free drift check |
| `build-mobile-web` | `npx expo export --platform web`, uploads `dist/` (needs lint + typecheck + test) |
| `lint-web` / `typecheck-web` / `build-web` | The same three for the Next.js app in `web/` |
| `python` | `ruff check .` + `pytest` for the analytics functions |

Mobile builds (iOS/Android via EAS) are present but commented out — they need
an `EXPO_TOKEN`.

**Docs drift check** (`scripts/docs/check-docs.js`) fails the build when: shipped
code reads a `process.env` variable `.env.example` does not document; a retired
name (`ANTHROPIC_API_KEY`, `AI_GATEWAY_API_KEY`, the invented `mukoko-lingo`
database) reappears outside the history that legitimately mentions it; or
CLAUDE.md's test-suite count no longer matches the suites on disk. Add a
retired name to `RETIRED_TERMS` whenever you remove one.

### Release (`.github/workflows/release.yml`)

Releases are **automatic**. The workflow fires on the CI workflow *completing
successfully* on `main` (`workflow_run`), so a merge whose tests fail is never
tagged. It derives the next version from Conventional Commit subjects since the
last tag, bumps every version file, moves `CHANGELOG.md`'s `[Unreleased]`
section under the new heading, commits `chore(release): vX.Y.Z [skip ci]`, tags,
and publishes a GitHub Release whose notes are that changelog section.

- `feat:` → minor, `fix:`/`perf:`/`refactor:` → patch, `docs:`/`chore:`/`ci:`/
  `test:` → **no release** (the job reports "No release" and exits 0)
- Below 1.0.0 a breaking change lands as a minor; cutting 1.0 is a manual
  `workflow_dispatch`
- The version-bump commit is pushed with the org-wide `RELEASE_BUMP_TOKEN`
  (per-repo `RELEASE_TOKEN` overrides it). If that push is rejected, the tag and
  Release still go out against the merge commit and the job logs a warning

Preview with `npm run release:dry`. Full details, including the failure table:
[RELEASES.md](RELEASES.md).

## Common Workflows

### Adding a New Phrase Category
1. Use the admin web app to create/edit phrases
2. Phrase metadata in `lingo.phrase`, translations in `lingo.translation`
3. Adding a new language = INSERT translation rows (no schema change)

### Adding a New API Route
1. Create file in `api/[feature]/` following Vercel serverless function pattern
2. Import auth middleware: `import { requireAuth, requireAdmin } from '../_lib/auth-middleware'`
3. Import Mongo collections: `import { phrases } from '../_lib/mongo'`
4. Handle CORS if needed: `import { cors } from '../_lib/cors'`
5. Add corresponding method to `lib/services/api-client.ts`

### Adding a New Mobile Screen
1. Create `.tsx` file in appropriate `app/` directory
2. For tabbed screens: Add to `app/(tabs)/` and update `app/(tabs)/_layout.tsx`
3. For admin screens: Add to `app/admin/` (auto-protected by admin layout)
4. Use `useTheme()` hook for theme-aware colors from `constants/Colors.ts`

### Working with AI Features
1. Chat goes through `/api/ai/chat`; conversation storage lives at
   `api/ai/conversations/`. No provider key ever reaches the client.
2. Client calls the route via `lib/ai/chat-service.ts` — it may send
   `language`, `conversation_type` and a numeric `proficiency` map, and
   **nothing else that shapes the prompt**.
3. Moderation belongs on the **server** (`api/_lib/moderation.ts`), applied to
   every turn. `lib/ai/moderation.ts` is a client-side pre-check for UX only —
   adding a check there does not protect the endpoint.
4. Any new field read from `req.body` that reaches a model must go through an
   allowlist or a numeric clamp; see `api/_lib/chat-input.ts` and
   `sanitizeClientScores`.
5. Store conversations via `aiApi.createConversation()` and `aiApi.storeMessage()`
6. Failed moderation creates `moderation_alerts` for admin review

### Modifying Learning Standards
1. Use admin UI at admin → standards
2. Standards stored in `learning_standards` collection
3. Standards define vocabulary complexity and explanation depth per proficiency level
4. Changes affect AI conversation context

## Special Considerations

### Authentication Security
Authentication is handled by WorkOS AuthKit. Access/refresh tokens are stored in SecureStore (native) or AsyncStorage (web). All API routes validate the access token locally against WorkOS's JWKS on the server side. Profiles are auto-created on first API call if the WorkOS user doesn't have one.

### Phrase Languages
The `Phrase` model supports **4 languages**: English, Shona, Ndebele, and Chinese. Each has corresponding pronunciation and context fields. Swahili is supported by the AI tutor in conversation but does not have a dedicated column in the phrases schema.

### Build Configuration
- Web build uses Expo export (`npx expo export --platform web`)
- Deployed to Vercel as static SPA with API routes
- Deep linking scheme: `mukokolingo://`
- New Architecture enabled (`newArchEnabled: true`)
- Typed routes enabled via Expo experiments

### Performance Notes
- Phrases limited to 100-200 per query
- Client-side filtering for categories/search
- Python analytics use MongoDB aggregation pipelines (same database the TypeScript API writes to)
- AI chat uses direct API calls (no streaming on mobile)

### Technical Debt
- Component library is minimal (basic themed components only)
- Limited error boundaries
- No dedicated web layout components (sidebar, etc.)

## Testing Locally

1. Configure environment variables (see Environment Setup above)
2. Start dev server: `npx expo start`
3. Sign up for a test account via the auth screen
4. To test admin features, set your role to 'admin' in the `learner_profiles` MongoDB collection (not `identity.persons` — that's the shared ecosystem record)
5. Test AI features in the Shamwari tab (requires `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` server-side, falls back to simulated mode without them)
6. Check moderation queue in admin → moderation
7. Test theme switching (light/dark/system)

---

## Documentation Structure

### Root Directory (Essential documents only):
- **CLAUDE.md** - Developer guide (this file)
- **README.md** - Project overview and quick start
- **BRANDING.md** - Brand guidelines, colors, typography
- **SECURITY.md** - Security architecture, WorkOS AuthKit
- **CHANGELOG.md** - Version history; `[Unreleased]` is published as release notes
- **CONTRIBUTING.md** - Commit conventions and their release effect, PR flow
- **RELEASES.md** - Release automation, channels, what is still manual

### Technical Documentation (`/docs/`):
- **[docs/TEST_COVERAGE_ANALYSIS.md](docs/TEST_COVERAGE_ANALYSIS.md)** - What the suite covers, where the floors are missing
- **[docs/ECOSYSTEM_DATA_MIGRATION.md](docs/ECOSYSTEM_DATA_MIGRATION.md)** - Moving onto the shared ecosystem collections
- **[docs/EMAIL_TEMPLATES.md](docs/EMAIL_TEMPLATES.md)** - Branded transactional email, now authored in the WorkOS AuthKit dashboard

### Scripts (`/scripts/`):
- `scripts/create-indexes.ts` - MongoDB index creation (schemaless DB, indexes are the schema)
- `scripts/seed-phrases.ts` / `scripts/seed-skills.ts` - Seed content collections
- `scripts/release/` - Release automation: `version.js` (bump rules),
  `changelog.js` (`[Unreleased]` surgery), `version-files.js` (per-file
  transforms), `prepare-release.js` (CLI, `--dry-run`)
- `scripts/docs/check-docs.js` - Documentation drift check (CI job `docs`)
- **[scripts/DATABASE_SCHEMA_REVIEW.md](scripts/DATABASE_SCHEMA_REVIEW.md)** - Database schema documentation
- **[scripts/MIGRATION_SUMMARY.md](scripts/MIGRATION_SUMMARY.md)** - Migration history

### Agents (`/.claude/agents/`):
- `docs-maintainer` - Keeps the written record true; run it whenever a change
  alters something documented, and whenever the drift check fails
- `admin-experience-guardian` - New features get the admin controls to manage them
- `auth-security-auditor` - Auth, RBAC and CRUD authorization review

### Creating New Documentation

When creating new completion summaries, migration docs, or work records:
1. Place technical docs in `/docs/`
2. Place migration/script docs in `/scripts/`
3. Keep root directory clean - only essential, frequently-referenced documents belong there
4. Never hand-edit a version number — the release job owns every one of them

---

## Project Status

**Current Version**: 0.1.0 (2026-09-01)
**Framework**: Expo SDK 57 / React Native 0.86 / React 19
**Backend**: MongoDB + WorkOS AuthKit + Vercel Serverless
**AI**: Cloudflare Workers AI (`@cf/qwen/qwen3-30b-a3b-fp8`) via Cloudflare AI Gateway
**Status**: Active development
**Parent Company**: Nyuchi Africa (nyuchi.com)

**Architecture Highlights**:
- Skills-based learning system fully modeled in MongoDB collections
- Adaptive AI tutor reads user proficiency for every interaction
- Multi-platform: single codebase for web, iOS, and Android
- Python analytics and the TypeScript API share the same MongoDB database
- Comprehensive admin dashboard (8 sections)
- Content moderation with both local guardrails and AI-based review
