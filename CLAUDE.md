# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mukoko Lingo is an AI-first, skills-based multilingual language learning platform** (English, Shona, Ndebele, Chinese) with both web and mobile (Expo/React Native) applications, powered by MongoDB, WorkOS AuthKit, Vercel Serverless Functions, and Anthropic Claude.

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
2. **Shamwari AI Tutoring** - AI powered by Anthropic Claude (`claude-haiku-4-5-20251001`), adapts to learner's proficiency level
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
```

## Environment Setup

**Required Environment Variables** (see `.env.example` for full template):

```bash
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/mukoko-lingo

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

# Anthropic Claude API Key (for mobile AI tutor)
# Model: claude-haiku-4-5-20251001
# Anthropic API Key is SERVER-SIDE ONLY (proxied via /api/ai/chat)
# ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Vercel AI Gateway (for web API routes)
AI_GATEWAY_API_KEY=your_api_key_here
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
│   │   ├── chat-service.ts       # Anthropic Claude API for Shamwari
│   │   ├── skills-aware-prompts.ts # Adaptive prompts based on proficiency
│   │   └── moderation.ts         # Content moderation (local + AI)
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
├── scripts/                      # DB migration scripts + utilities
├── docs/                         # Technical documentation
├── .github/workflows/ci.yml     # CI pipeline (TypeScript + tests + web build)
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
| Database | MongoDB (database `mukoko-lingo`) |
| Auth | WorkOS AuthKit (hosted sign-in, PKCE authorization-code flow) |
| AI | Anthropic Claude Haiku 4.5 (direct API + Vercel AI Gateway) |
| Testing | Jest 29 + jest-expo + React Testing Library |
| CI/CD | GitHub Actions (typecheck → test → build-web) |

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

**Database**: Lingo's own operational data lives in `mukoko-lingo`, accessed via `lib/db/mongo.ts` (client singleton, `getDb(name?)`) and `lib/db/collections.ts` (typed per-collection accessors). Schemaless — indexes are created via `scripts/create-indexes.ts`. The MongoDB cluster is **shared across the Nyuchi ecosystem** — `identity`, `entity`, `lingo`, `engagement`, etc. are sibling databases on the same cluster, each owned by a different domain/app. Lingo must never invent its own parallel user table; it reads/writes the shared `identity` database for user identity (see below).

**User & Authentication** — split across two databases, merged at the API layer (`lib/db/identity.ts`):
- `identity.persons` (shared, ecosystem-wide, **not Lingo-owned**) — the real user record: UUID string `_id` (used as the OIDC `sub` claim), OIDC standard claims (`email`, `givenName`, `familyName`, `name`, `locale`, etc.), `workosUserId` mapping to WorkOS. Other Nyuchi apps (identity, entity, ubuntu, etc.) read and write this same collection.
- `mukoko-lingo.learner_profiles` (Lingo-local) — the extension fields the shared schema has no room for: `role` (`user`/`admin`), `status`, `preferred_ui_language`, `learning_goal`, `daily_goal`, push token, streaks. Keyed on `person_id` (== `identity.persons._id`).
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

**Mobile AI (Direct Anthropic API)**:
- **API Key**: `ANTHROPIC_API_KEY` (server-side only, proxied via `/api/ai/chat`)
- **Model**: `claude-haiku-4-5-20251001`
- **Implementation**: `lib/ai/chat-service.ts` - Direct `fetch()` to Anthropic Messages API
- **Fallback**: Simulated responses when no API key is set (demo/offline mode)

**Web AI (Vercel AI Gateway)**:
- **API Key**: `AI_GATEWAY_API_KEY` environment variable
- **SDK**: `@ai-sdk/openai` + `ai` packages for streaming via Vercel AI SDK

**Core AI System** (`lib/ai/skills-aware-prompts.ts`):
- `buildSkillsAwarePrompt(conversationType, language)` - Called for EVERY AI interaction
- Reads user skills from local storage via `getUserSkills()`
- Builds adaptive system prompt with:
  - User proficiency profile (overall + individual skills)
  - Vocabulary complexity guidance (simple → native-level)
  - Grammar complexity guidance (present simple → full grammatical range)
  - Scaffolding level (maximum support → peer conversation)
  - Error correction approach (correct everything → no corrections)
  - Conversation type specific guidance (practice/scenario/translation_help)

**Content Moderation** (`lib/ai/moderation.ts`):
- Local guardrails (pattern/keyword matching against `guardrails` collection)
- AI-based moderation via Claude Haiku for nuanced content
- 6 core categories: sexual content, hate speech, harassment, violence, self-harm, misinformation
- Flagged content creates `moderation_alerts` for admin review

**AI Message Storage** (`api/ai/conversations/`):
- `POST /api/ai/conversations` - Create conversation
- `GET /api/ai/conversations/:id/messages` - Get messages
- `POST /api/ai/conversations/:id/messages` - Store message

**Conversation Starters**: `getConversationStarters(language)` in `chat-service.ts` provides language-specific starting prompts.

### Navigation System

**Mobile Tab Navigation** (`app/(tabs)/_layout.tsx`):
1. **Learn** (`index.tsx`) - Daily lesson (flash cards + quiz) and phrase browsing with language selector, search, category filters
2. **Shamwari** (`ai-practice.tsx`) - AI chat tutor powered by Anthropic Claude, accepts phrase context from Learn/Phrase screens
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

Skills-aware prompts read from local storage, not the API:

```typescript
import { getUserSkills } from '@/lib/storage/database'
// Platform-agnostic: AsyncStorage (web) or SQLite (native)
```

## Database Schema Management

**Schema Management**: MongoDB is schemaless; indexes are created via `scripts/create-indexes.ts`.

## Testing Infrastructure

- **Framework**: Jest 29 with jest-expo preset, React Testing Library
- **CI pipeline**: GitHub Actions runs TypeScript check + tests on push to `main` and `feature/*`
- **Coverage**: Tracked via `jest --coverage`, collected from `lib/**` and `components/**`

**Test Suites** (8 suites, 107+ tests):
- `lib/ai/__tests__/chat-service.test.ts` - AI chat simulation + moderation integration
- `lib/ai/__tests__/moderation.test.ts` - Content moderation (local + AI)
- `lib/auth/__tests__/workos-client.test.ts` - WorkOS AuthKit flow tests
- `lib/data/__tests__/phrases-data.test.ts` - Phrase data integrity validation
- `lib/data/__tests__/assessment-questions.test.ts` - Question bank validation
- `lib/data/__tests__/translations.test.ts` - Translation completeness
- `lib/hooks/__tests__/useLearningLanguage.test.tsx` - Hook behavior
- `lib/storage/__tests__/database.test.ts` - Storage operations (bookmarks, progress, skills, sessions)

## CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`):

1. **TypeScript Check** - `npx tsc --noEmit` (Node 20)
2. **Run Tests** - `npm test -- --ci --coverage` (Node 20)
3. **Build Web** - `npx expo export --platform web` (depends on steps 1+2 passing)
   - Uploads `dist/` as artifact (7-day retention)
4. Mobile builds (iOS/Android via EAS) - commented out, require `EXPO_TOKEN`

**Triggers**: Push to `main` or `feature/*`, Pull requests to `main`

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
1. All AI endpoints stored at `api/ai/conversations/`
2. Client-side AI via `lib/ai/chat-service.ts` (direct Anthropic API)
3. Add moderation check using `moderateContent()` from `lib/ai/moderation.ts`
4. Store conversations via `aiApi.createConversation()` and `aiApi.storeMessage()`
5. Failed moderation creates `moderation_alerts` for admin review

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
5. Test AI features in the Shamwari tab (requires `ANTHROPIC_API_KEY` server-side, falls back to simulated mode without it)
6. Check moderation queue in admin → moderation
7. Test theme switching (light/dark/system)

---

## Documentation Structure

### Root Directory (Essential documents only):
- **CLAUDE.md** - Developer guide (this file)
- **README.md** - Project overview and quick start
- **BRANDING.md** - Brand guidelines, colors, typography
- **SECURITY.md** - Security architecture, WorkOS AuthKit
- **CHANGELOG.md** - Version history
- **RELEASES.md** - Release management and versioning

### Technical Documentation (`/docs/`):
- **[docs/EMAIL_TEMPLATES.md](docs/EMAIL_TEMPLATES.md)** - Branded email templates (stale — predates both the Stytch and WorkOS integrations; email templates now live in the WorkOS AuthKit dashboard)
- **[docs/TEST_COVERAGE_ANALYSIS.md](docs/TEST_COVERAGE_ANALYSIS.md)** - Test suite analysis

### Scripts (`/scripts/`):
- **[scripts/migrations-README.md](scripts/migrations-README.md)** - Database migration guide
- **[scripts/MIGRATION_SUMMARY.md](scripts/MIGRATION_SUMMARY.md)** - Migration history
- **[scripts/DATABASE_SCHEMA_REVIEW.md](scripts/DATABASE_SCHEMA_REVIEW.md)** - Database schema documentation
- `scripts/028_seed_standards_guardrails.sql` - Database seed data
- `scripts/apply-migrations.sh` - Migration runner
- `scripts/apply-critical-fixes.sh` - Critical fix runner

### Creating New Documentation

When creating new completion summaries, migration docs, or work records:
1. Place technical docs in `/docs/`
2. Place migration/script docs in `/scripts/`
3. Keep root directory clean - only essential, frequently-referenced documents belong there

---

## Project Status

**Current Version**: 0.0.1 (April 2026)
**Framework**: Expo SDK 54 / React Native 0.81 / React 19
**Backend**: MongoDB + WorkOS AuthKit + Vercel Serverless
**AI**: Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`)
**Status**: Active development
**Parent Company**: Nyuchi Africa (nyuchi.com)

**Architecture Highlights**:
- Skills-based learning system fully modeled in MongoDB collections
- Adaptive AI tutor reads user proficiency for every interaction
- Multi-platform: single codebase for web, iOS, and Android
- Python analytics and the TypeScript API share the same MongoDB database
- Comprehensive admin dashboard (8 sections)
- Content moderation with both local guardrails and AI-based review
