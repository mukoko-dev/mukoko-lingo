# Changelog - Mukoko Lingo

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

_Nothing yet._

---

## [0.4.0] — 2026-09-10

### Added
- **31 intermediate and advanced assessment questions** (`api/_lib/question-bank.ts`),
  taking the bank from 95 to 126 — intermediate 24 → 42, advanced 16 → 28.
  Weighted to the cells that could not fill a quiz at all: Chinese conversation
  had **no** questions below advanced, and Swahili pronunciation had one or two
  at every level. Every skill in every language can now fill an intermediate
  and an advanced quiz, which `question-bank.test.ts` pins — a cell below
  `MIN_QUESTIONS` silently issues a shorter quiz, and the v0.3.0 difficulty cap
  then reads that as weaker evidence, so coverage is now load-bearing rather
  than cosmetic.

  Content covers tone sandhi and 把/过/measure words in Chinese, penultimate
  stress and noun-class concord in Swahili, the negative circumfix and
  applicative extension in Shona, and ukuthi clauses and class-2 agreement in
  Ndebele, plus pragmatic items (declining without loss of face, Shikamoo →
  Marahaba, 你吃了吗 as a greeting) that reward comprehension over vocabulary
  recall.

---

## [0.3.0] — 2026-09-09

### Security
- **The server issues the assessment, not just the score** — grading moved
  server-side in v0.2.0, but the answer key was still built from the question
  ids the *caller* submitted (`answerKeyFromBank(bank, Object.keys(answers))`).
  Submitting a single correct answer therefore scored 1/1 = 100% and wrote
  `user_skills.current_score = 100`, which `api/_lib/tutor-prompt.ts` reads on
  every AI turn: the caller could not choose the numerator, but choosing the
  denominator did just as well. Found by running the real grading module
  against the real question bank, which the mocked route tests could not show —
  they supplied the key that the live code derives from the request.

  `POST /api/assessments/start` now selects the questions and records their ids
  in `lingo.assessment_sessions`; `POST /api/assessments/submit` requires that
  `session_id` and grades against the issued set. An unanswered question is
  wrong, an id that was never issued is not graded, and a session is single use
  (claimed with a conditional update, so two concurrent submissions cannot both
  grade it), expiring after two hours, and readable only by its owner — another
  learner's id returns 404 rather than 403.
- **A score cannot exceed what the questions asked could demonstrate**
  (`ceilingForLevels`) — found by driving the real start/submit handlers
  against the real question bank rather than mocks. `getDiagnosticQuestions`
  selects only `level: 'beginner'` questions, so a diagnostic that sampled a
  skill with **one** four-option question was writing
  `user_skills.current_score = 100` — "fluent" — for that skill, and
  `tutor-prompt.ts` reads that number on every AI turn. Retakes are unlimited
  and keep the best score, so guessing until it landed cost nothing. A
  persisted score is now capped at the top of the band above the hardest
  question asked (beginner → 64, elementary → 79, intermediate → 89,
  advanced → 100), per skill. The reported percentage is unchanged; only what
  is recorded as proficiency is limited, and a higher score already earned on
  harder questions is never revoked.
- **The answer key no longer ships to the client** —
  `lib/data/assessment-questions.ts` carried every `correctAnswer` into the app
  bundle, so a learner could read the answers out of the JavaScript. It now
  lives at `api/_lib/question-bank.ts`, and questions cross to the client
  through `toPublicQuestion`, which drops the answer and the explanation. Both
  come back in the submit response, after the attempt is closed.
  `question-bank-isolation.test.ts` walks `app/`, `components/`, `lib/`,
  `constants/` and `web/` and fails if anything imports it back — a re-added
  import would break no type check and no other test.

### Changed
- **The assessment screen no longer grades locally.** It asks the server for a
  quiz, submits answers, and shows the server's verdict. Two consequences worth
  knowing: there is no per-question "Correct!" during the quiz (the screen does
  not know — the full review with answers and explanations arrives with the
  result), and assessments now need connectivity, so the screen offers a retry
  instead of silently showing an empty quiz.
- `user_assessments` rows carry the `session_id` they were graded under.
- `scripts/create-indexes.ts` adds an `assessment_sessions` TTL index, so
  lapsed quizzes are swept rather than accumulating.

---

## [0.2.0] — 2026-09-08

### Security
- **Assessments are graded on the server** — `POST /api/assessments/submit`
  recorded whatever `score` and `passed` the caller sent, and promoted
  `user_skills.current_level` on that basis, so anyone who could reach the
  route could promote themselves. Because `user_skills.current_score` is read
  by `api/_lib/tutor-prompt.ts` for every AI turn, a forged score did not only
  unlock content — it changed how Shamwari taught that learner. The route now
  computes the score from the submitted answers against an answer key it
  resolves itself (the `lingo.assessments` document when one exists, otherwise
  the shared question bank), and **rejects** a body carrying `score` or
  `passed` rather than ignoring it. A level is only promoted by a real
  assessment document naming a `target_level`, so a pass on a client-assembled
  quiz records a score and nothing more. The client now submits answers; it
  still grades locally for immediate feedback, but only the server's number is
  persisted.
- **Log messages are data, not format strings** (`api/_lib/logger.ts`) — every
  route builds its message with a template literal over request data, and Node
  reads `console.error`'s first argument as a `util.format` template. A `%s` in
  a submitted field could swallow the next argument and rewrite the line, and a
  newline could forge an entire extra entry. The prefix and message are now
  passed as arguments to a constant `'%s %s'`, and control characters are
  replaced. Flagged by CodeQL on the grading PR, whose new log lines carry a
  caller-supplied `skill_id` and `assessment_id`.
- **`user_skills` rows are written against the `skills._id`** — the question
  bank labels skills by name, and a name in that column produces a row the
  tutor prompt and the skills API both silently ignore. The route resolves
  either form before writing.

### Fixed
- **Assessment routes resolve a UUID `_id`** (`api/_lib/doc-id.ts`) — all three
  looked assessments up by `ObjectId` only. `lingo.assessments` is empty and
  unseeded while every populated `lingo` collection uses UUID strings, so a
  UUID-seeded assessment would have 404'd from `GET /assessments/:id`, gone
  unjoined in the history, and — worst — skipped the promotion branch in submit
  without any error.

### Changed
- **The release job pushes its version bump with `RELEASE_BUMP_TOKEN`** — the
  org-wide PAT that can push through branch protection, with a per-repo
  `RELEASE_TOKEN` as an override. v0.1.0 and v0.1.1 were both tagged on their
  merge commits because the bump was rejected; the workflow simply was not
  asking for a token that already existed. The fallback (tag the merge commit,
  publish the Release anyway) is unchanged, and its warning now names the
  likely cause instead of telling the reader to create a new PAT.

---

## [0.1.1] — 2026-09-01

### Fixed
- **release**: count the next version from the tag when it is ahead of the files (#40) (`b8cb526`)

---

## [0.1.0] — 2026-09-01

### Security
- **AI system prompt moved server-side** — `/api/ai/chat` now builds the tutor prompt in `api/_lib/tutor-prompt.ts` from the authenticated user's proficiency and ignores any caller-supplied `system_prompt`. The only request fields that influence the prompt are `language` and `conversation_type`, both mapped through allowlists in `lib/ai/prompt-builder.ts`, so an unrecognised value becomes a known constant instead of reaching the template.
- **Chat input is validated as a security boundary** (`api/_lib/chat-input.ts`) — a client-supplied `system` role is rejected outright (a provider would read it as instructions), along with unknown roles and non-string content. History is capped and forced to open on a user turn.
- **Moderation enforced on the server, across the whole history** — guardrails moved to `api/_lib/moderation.ts` and now scan *every* turn rather than only the newest. Previously moderation lived solely in the client bundle, so posting straight to the route bypassed it, and a payload placed in an earlier turn or a forged `assistant` turn reached the model unchecked. Blocked requests return 400 with the guardrail reason, which the client now surfaces instead of a generic connection error.
- **`moderation_alerts` are actually written** — the admin review queue and analytics read the collection, but nothing had ever written to it, so the queue could never show an item.
- **Logout revokes the WorkOS session again** — `verifyAccessToken` accepts a `allowExpired` option so sign-out can revoke the session behind an already-expired access token. Signature and all other claims are still verified; only the expiry window widens.
- **Six UUID/ObjectId query fixes** — leftovers from the Supabase→MongoDB migration. One would have made every moderation alert permanently unresolvable.

### Fixed
- **Web sign-in dead end** — AuthKit issued the authorization code then tried to hand it to `mukokolingo://`, which no browser can open. `lib/auth/workos-client.ts` is now platform-aware and navigates the full page on web.
- **Adaptive tutoring restored** — moving the prompt server-side made it read `lingo.user_skills`, which is empty and written by nothing (scores live in device storage), so Shamwari scaffolded every learner as an absolute beginner. The client now sends a numeric proficiency map that the server clamps; stored scores win whenever they exist.
- **Redirect allowlist matched what clients actually compute** from `window.location.origin` — private-LAN Expo dev hosts and the bare `mukoko-lingo.vercel.app` alias were rejected before WorkOS ever saw them.
- **`max_tokens` had a ceiling but no floor** — a negative or fractional value reached the provider and came back as a 502. Now clamped to an integer in [1, 4096].

### Added
- **Releases are automatic** (`.github/workflows/release.yml`) — a merge to
  `main` whose CI run goes green is tagged and published without anyone
  touching a version number. The next version is derived from Conventional
  Commit subjects since the last tag (`feat:` minor, `fix:`/`perf:`/`refactor:`
  patch, housekeeping releases nothing, and a breaking change stays inside 0.x
  until 1.0 is cut deliberately). The job bumps all nine files that carry the
  version, moves `CHANGELOG.md`'s `[Unreleased]` section under the new heading,
  tags, and publishes a GitHub Release whose notes are that section. Preview
  any merge's outcome with `npm run release:dry`. Full details in
  [RELEASES.md](RELEASES.md).
- **Documentation drift check** (`scripts/docs/check-docs.js`, CI job `docs`) —
  fails the build when shipped code reads an environment variable
  `.env.example` does not document, when a retired name (`ANTHROPIC_API_KEY`,
  `AI_GATEWAY_API_KEY`, the invented `mukoko-lingo` database) reappears in the
  docs, when a relative markdown link points at nothing, or when CLAUDE.md's
  test-suite count no longer matches the suites on disk. It found an
  undocumented `NEXT_PUBLIC_API_BASE_URL` and four dead documentation links on
  its first run.
- **`docs-maintainer` agent** (`.claude/agents/docs-maintainer.md`) — owns
  keeping the written record true, with the checklist of documents that go
  stale together (change an env var, and five files need visiting).
- **BRANDING.md** — the Five African Minerals palette, voice, typography and
  touch-target rules, derived from `constants/Colors.ts`. Three documents had
  been linking to it for months; it had never existed.
- **Single-provider AI transport with a circuit breaker** (`api/_lib/ai-provider.ts`) — Cloudflare Workers AI reached through Cloudflare AI Gateway, on the OpenAI-compatible `/ai/v1/chat/completions` endpoint. 3 failures open the breaker for 5 minutes, so an outage fails fast instead of making every learner wait out the 15s timeout. `AiNotConfiguredError` and `AiUnavailableError` stay distinct so moderation cannot silently pass all content when it breaks.

### Changed
- **AI provider: Anthropic + Vercel AI Gateway → Cloudflare Workers AI** — inference is now `@cf/qwen/qwen3-30b-a3b-fp8` on Workers AI, routed through Cloudflare AI Gateway. `ANTHROPIC_API_KEY` and `AI_GATEWAY_API_KEY` are gone, replaced by `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` (required) and `CLOUDFLARE_AI_GATEWAY_ID` / `CLOUDFLARE_AI_GATEWAY_TOKEN` / `WORKERS_AI_MODEL` (optional). The Anthropic Messages transport, the dual-credential split and the per-language Kimi routing were all removed — `language` and `conversation_type` now shape only the system prompt. Conversation documents record `modelProvider: 'cloudflare'`, and the unused `ai` / `@ai-sdk/openai` packages were dropped from `package.json`.
- **Database: Supabase PostgreSQL → MongoDB** — Reverted the data layer back to MongoDB (the platform's original database before the 0.0.1 Supabase migration). All API routes now read/write MongoDB collections via `lib/db/mongo.ts` / `lib/db/collections.ts` instead of `@supabase/supabase-js`. Phrases collapse from a normalized `phrase`+`translation` join into one flat document per phrase (matching the pre-Supabase shape already used by `lib/data/phrases-data.ts`); `ai_conversations` now embed their messages; hand-rolled "select-then-insert" upserts (phrase progress, user skills, SRS cards, assignment submissions) became atomic `findOneAndUpdate`/`bulkWrite` upserts. Fixed two latent bugs surfaced during the port: the auth lookup now keys profiles on the stable WorkOS `workos_user_id` instead of email, and the leaderboard query's `user_id`/`person_id` field-name inconsistency was standardized on `user_id`.
- **Auth: Stytch → WorkOS AuthKit** — Replaced Stytch (email OTP, WhatsApp OTP, magic links) with WorkOS AuthKit's hosted sign-in page via the PKCE authorization-code flow. `api/_lib/auth-middleware.ts` now verifies access tokens locally against WorkOS's JWKS instead of round-tripping to the auth provider on every request. WhatsApp OTP has no WorkOS equivalent and was dropped.
- **Documentation rewritten against the code, not from memory** —
  `RELEASES.md` now describes the automated flow instead of a manual
  branch-tag-publish ritual (and no longer names a `mukoko-lingo` database);
  `docs/TEST_COVERAGE_ANALYSIS.md` was measuring 8 suites and a Supabase client
  that no longer exists, and now reports the real 42 suites, the thin
  functions-threshold margin, and the fact that `api/**` — every security
  boundary in the app — has no coverage floor at all;
  `docs/EMAIL_TEMPLATES.md` was configuring Supabase email with a palette that
  is not the brand's, and now targets the WorkOS AuthKit dashboard;
  `.env.local.example` was pure Supabase/OpenAI/Next.js from before the
  migration. `CONTRIBUTING.md` gained the commit-type → release-effect table,
  since a commit subject now decides the version.
- **Dependencies** — Updated all packages across `root` and `web/`: Expo SDK 54 → 57, Next.js 15 → 16, Tailwind CSS 3 → 4. Held back `jest`/`@types/jest` (jest-expo still requires Jest 29) and `@testing-library/react-native` (v14 switches to async `render()`/`renderHook()`, which would require rewriting every test file).

---

## [0.0.1] — 2026-04-08

### Initial Release: Supabase Migration & Platform Architecture

Major migration from MongoDB/Prisma to Supabase PostgreSQL with normalized schemas, plus Next.js web app, school/business model, and registry compliance.

### Added
- **Supabase PostgreSQL** — All API routes wired to `lingo.*` / `identity.*` / `system.*` schemas
- **Next.js Web App** — Full browser experience at `/web` with learning + admin dashboard
- **School/Business Model** — Classes, memberships, assignments, submissions API endpoints
- **OneRoster v1.1 Sync** — Pull rosters from Clever, ClassLink, PowerSchool
- **Org API Key Management** — Self-service API key create/list/revoke
- **Server-Side AI Proxy** — Anthropic API key moved server-side with circuit breaker (3 failures/5min) and rate limiting (30 req/hr)
- **Prompt Injection Detection** — 14 patterns catch instruction manipulation before AI
- **Error Boundaries** — Route-level and section-level error boundaries on all tab screens
- **Structured Logging** — `[mukoko][module]` prefix across API routes
- **Retry with Backoff** — API client retries 3x with 1s/2s/4s delays on 5xx/network errors
- **Request Timeouts** — 15s AbortController timeout on all fetch calls
- **Five African Minerals Tailwind** — Full color palette (cobalt, tanzanite, malachite, gold, terracotta)
- **5-Layer Architecture** — L1 primitives → L2 domain → L3 orchestrators → L4 boundaries → L5 pages
- **GitHub Templates** — CONTRIBUTING, CODE_OF_CONDUCT, issue templates, PR template, CODEOWNERS

### Changed
- **Database** — MongoDB Atlas + Prisma → Supabase PostgreSQL (3 schemas, 20 tables)
- **Phrase Storage** — Flat columns → normalized `phrase` + `translation` (1 row per language per phrase)
- **Auth Identity** — MongoDB Profile (ObjectId) → `identity.person` (UUID)
- **Bookmarks** — Separate collection → `phrase_progress.bookmarked` flag
- **AI Conversations** — Added `shamwari_conversation_id` and `scylladb_message_id` fields
- **CORS** — Restricted from wildcard `*.vercel.app` to exact production domain
- **Mobile App** — Stripped admin features (moved to web app)

### Removed
- **MongoDB Atlas** — All MongoDB dependencies removed
- **Prisma ORM** — Schema and client removed (replaced by Supabase JS)
- **NativeWind/Tailwind** — Removed from mobile app (belongs in web app only)
- **Admin screens** — 10 admin screens moved to Next.js web app
- **Client-side API key** — `EXPO_PUBLIC_ANTHROPIC_API_KEY` removed (now server-side)

---

## [3.1.0] — UX Overhaul

### Added
- **Daily Lessons** - Smart phrase selection system (5 phrases/day) prioritizing weak skills and unmastered content
- **Flash Cards** - Flip-to-reveal card component for learning phrases with pronunciation guides
- **Mini Quiz** - 3-option multiple choice quiz after reviewing daily lesson cards
- **Celebration Cards** - Animated celebrations for daily goal completion and quiz results
- **Daily Goal System** - Track phrases learned per day with progress bars throughout app
- **Streak Banner** - Persistent streak display on Learn tab for habit reinforcement
- **Phrase Context in AI** - Shamwari now accepts phrase context from Learn/Phrase screens for contextual practice
- **Skill Score Updates** - Phrase practice and mastery now updates skill scores automatically
- **UI Language System** - Full `useUILanguage` hook with system language detection and 5-language support
- **Header Language Selector** - Globe dropdown in AppHeader for switching UI language

### Changed
- **Tab Restructure (5→4)** - Removed Skills tab, merged content into new Progress tab (Dashboard + Phrases views)
- **Learn Tab** - Split into "Today's Lesson" (daily flash cards + quiz) and "Browse All" (original phrase browser)
- **Progress Tab** - Combined dashboard with daily goal, stats, skill proficiency, and phrase mastery breakdown
- **Profile Tab** - Removed duplicate stats (now in Progress tab)
- **Header Colors** - Changed icon pill from Tanzanite secondary to Cobalt primary colors
- **Onboarding** - Simplified from 4 slides to 2 slides (Learn Phrases + Meet Shamwari)
- **Features/Why Pages** - Redirect to welcome page (content consolidated)
- **About Page** - Simplified to essential company info
- **Landing Page Routing** - Changed from onboarding-flag-based to auth-based routing

### Fixed
- **Landing Page Missing** - Users now always see welcome page when not authenticated
- **Language Preferences** - Added working UI language selector with system detection and persistence
- **Header Colors** - Primary Cobalt colors instead of secondary Tanzanite

### Technical
- New storage functions: `getDailyLesson`, `setDailyLesson`, `getDailyGoalProgress`, `updateDailyGoalProgress`
- New service: `lib/services/daily-lesson.ts` with smart phrase selection, quiz generation
- New components: `FlashCard`, `DailyLessonCard`, `MiniQuiz`, `CelebrationCard`
- New translations: 25+ keys added to all 5 languages (en, sn, nd, zh, sw)
- Updated tests for database operations and translation completeness

### Planned
- Offline mode support for phrase browsing
- Push notifications for study reminders
- Gamification elements (badges, achievements)
- Social features (study groups, leaderboards)
- Audio pronunciation guides
- Cultural context lessons

---

## [3.1.0] - 2026-02-11

### Stytch Auth Integration & Build Automation

This release completes the migration from Supabase to Stytch authentication with branded templates, WhatsApp OTP support, and automated database schema deployment.

### Added

#### Authentication
- **Stytch Auth Integration** - Complete authentication system with email/password, OTP, magic links
- **WhatsApp OTP** - WhatsApp-based one-time password authentication
- **Branded Email Templates** - Custom Stytch email templates matching Mukoko Lingo branding
- **Session Token Management** - SecureStore (native) and AsyncStorage (web) for session persistence

#### API & Infrastructure
- **Vercel Serverless API Routes** - Full REST API backend with Stytch session validation
- **Auth Middleware** (`api/_lib/auth-middleware.ts`) - `requireAuth()` and `requireAdmin()` for all API routes
- **CORS Helper** (`api/_lib/cors.ts`) - Cross-origin request handling for API routes
- **Prisma API Client** (`api/_lib/prisma.ts`) - Shared Prisma singleton for serverless functions
- **Stytch Configuration** (`lib/stytch/config.ts`) - Centralized template IDs, redirect URLs, session settings

#### Build & Deploy
- **Automated Schema Sync** - `prisma db push` runs automatically in `build:web` script on every Vercel deploy
- **Python Analytics Prototype** - pymongo aggregation pipelines for data analysis

### Changed
- **Sign-in UX** - Reordered sign-in options: WhatsApp OTP before password for better mobile UX
- **Brand Alignment** - `Colors.ts` aligned to Mukoko Lingo brand minerals palette
- **Build Command** - `build:web` now includes `prisma db push --skip-generate` before `expo export`

### Removed
- **Supabase** - All Supabase dependencies, client libraries, and references completely removed
- **Legacy Email Templates** - Supabase email templates replaced with Stytch branded templates

### Migration Notes

**From 3.0.0**: No database migration needed. Stytch project credentials must be configured in environment variables. See `.env.example` for required variables.

---

## [3.0.0] - 2025-12-11

### Major Release - AI-First Skills-Based Architecture

This release transforms Mukoko Lingo into an AI-first, skills-based learning platform where the AI tutor reads user proficiency from the database for every interaction.

### Added

#### Phase 2: Skills-Aware AI System
- **Skills-Aware AI Prompts** (`lib/ai/skills-aware-prompts.ts`) - AI reads user proficiency for every interaction
- **buildSkillsAwarePrompt()** function adapts teaching based on actual assessment scores
- **Adaptive Teaching Levels**:
  - Beginner (0-49): Simple vocabulary, present tense, maximum support
  - Elementary (50-64): Common vocabulary, basic tenses, high support
  - Intermediate (65-79): Varied vocabulary, all tenses, moderate support
  - Advanced (80-89): Sophisticated vocabulary, complex grammar, light support
  - Fluent (90-100): Native-level language, peer conversation
- **User Skills Utilities** (`lib/utils/user-skills.ts`) - 15+ helper functions for skills management

#### Phase 3: Diagnostic Assessment System
- **50-Question Diagnostic Assessment** (`lib/data/diagnostic-assessment.ts`)
  - 10 questions per skill covering beginner to fluent concepts
  - Shona language focus with cultural expressions
- **Assessment UI Component** (`components/diagnostic-assessment.tsx`)
  - Multi-step wizard interface
  - Skill-by-skill navigation
  - Progress tracking and skip functionality
- **Assessment Results View** (`components/diagnostic-results.tsx`)
  - Overall proficiency display
  - Individual skill breakdown with strongest/weakest badges
  - AI tutor personalization preview
- **Assessment Submission API** (`app/api/assessments/submit-diagnostic/route.ts`)
  - Auto-scoring and level calculation
  - Updates user_skills table for AI adaptation
- **Skills Dashboard** (`app/app/skills/page.tsx`)
  - Visual progress tracking across all skills
  - Overall statistics (practice time, phrases mastered, streak)
  - Action buttons for AI Tutor and Phrases

#### Database Migrations
- **Skills Taxonomy** (028): 5 core skills, 25 skill levels
- **Assessment System** (029): assessments, user_assessments tables with auto-update triggers
- **Phrases Integration** (030): Skills mapping for phrases
- **Complete Database Rebuild** (000_v2): Single comprehensive migration script

#### New Components
- `components/ui/radio-group.tsx` - Radix radio group for assessments
- `components/ui/skeleton.tsx` - Loading skeleton component

#### Navigation Updates
- Skills Dashboard added to sidebar navigation
- Target icon for skills route

### Changed

#### AI Integration
- AI chat API now uses `buildSkillsAwarePrompt()` instead of legacy `buildAISystemPrompt()`
- AI adapts vocabulary, grammar, scaffolding, and error correction based on user_skills table

#### Middleware
- Added onboarding check - new users redirected to diagnostic assessment
- Excludes diagnostic page and API routes from redirect

#### Documentation
- Updated CLAUDE.md with AI-first architecture documentation
- Added skills system, adaptive teaching levels, and utility functions

### Technical Details

- **Database Schema**: 14 tables with 40+ RLS policies
- **Skills System**: user_skills table read by AI for every interaction
- **Auto-Updates**: Triggers automatically update proficiency from assessments
- **Type Safety**: Comprehensive TypeScript types in `lib/types/skills.ts`

### Migration Notes

**Database**: Apply `000_complete_database_rebuild_v2.sql` via Supabase Dashboard SQL Editor

**New User Flow**:
1. Sign up → Login → Redirected to `/app/diagnostic`
2. Complete 50-question assessment (~15 minutes)
3. View results with skill breakdown
4. Start learning with personalized AI tutor

---

## [2.0.0] - 2025-11-10

### Major Release - Layout Standardization & Navigation Unification

This release represents a complete overhaul of the application's layout system and navigation architecture, providing a unified, responsive experience across all pages.

### Added

#### Layout System
- **SidebarLayout Component** - New responsive layout wrapper that automatically adjusts content margin based on sidebar collapse state
- **AdminLayout Component** - Centralized layout for all admin pages with consistent spacing and max-width constraints
- **Centered Layout Pattern** - All authenticated pages now use centered content with appropriate max-width constraints:
  - Forms/Reading: `max-w-4xl` (896px)
  - Interactive Content: `max-w-5xl` (1024px)
  - Data/Dashboards: `max-w-6xl` (1152px)

#### Navigation
- **Unified AppSidebar** - All authenticated pages now use AppSidebar for consistent navigation
- **Collapsible Sidebar** - Desktop users can collapse sidebar to icon-only mode (256px → 64px)
- **Responsive Sidebar** - Mobile users get overlay sidebar with hamburger menu
- **Theme Switcher in Sidebar** - Light/Dark/System theme control accessible everywhere
- **Language Switcher in Sidebar** - 4-language UI switcher (English, Shona, Ndebele, Chinese)

#### Hooks
- **useUILanguage()** - Centralized UI language state management with localStorage persistence
- **useSidebar()** - Global sidebar collapse state management

#### Documentation
- **DEPLOYMENT.md** - Comprehensive deployment guide with Vercel and Supabase instructions
- **SECURITY.md** - Complete security documentation covering all security layers
- **CHANGELOG.md** - This file for tracking version history
- **RELEASES.md** - Release management guidelines

### Changed

#### Page Updates
- **All App Pages** migrated from AppHeader to AppSidebar:
  - `/app/analytics` - Updated to use SidebarLayout with centered max-w-6xl
  - `/app/profile` - Updated to use SidebarLayout with centered max-w-4xl
  - `/app/ai-practice` - Updated to use SidebarLayout with centered max-w-5xl
  - `/app/progress` - Updated to use SidebarLayout with centered max-w-6xl
  - `/app/bookmarks` - Updated to use SidebarLayout with centered max-w-6xl

- **All Admin Pages** now use AdminLayout with consistent max-w-6xl:
  - `/admin/overview`
  - `/admin/users`
  - `/admin/phrases`
  - `/admin/standards`
  - `/admin/moderation`
  - `/admin/activity`

#### Component Refactoring
- **Removed conditional sidebar rendering** - Sidebar now always present on authenticated pages
- **Removed local language state** - All components now use `useUILanguage()` hook
- **Unified margin handling** - All pages use `SidebarLayout` instead of hardcoded `lg:ml-64`

#### User Experience
- **Consistent Navigation** - Same navigation pattern across all authenticated pages
- **Persistent Settings** - Theme and language preferences saved to localStorage
- **Smooth Transitions** - 300ms animations for sidebar collapse/expand
- **Mobile Optimization** - Improved mobile navigation with overlay sidebar

### Fixed
- **Sidebar Overlap Issues** - Content no longer overlaps with sidebar on any page
- **Language State Persistence** - UI language now persists across page navigation and refresh
- **Theme Accessibility** - Theme controls now accessible on all authenticated pages
- **Responsive Layout Issues** - Fixed content stretching on ultrawide monitors
- **Navigation Inconsistency** - All pages now have identical navigation patterns

### Documentation
- **Layout Migration Guides**:
  - SIDEBAR_LAYOUT_MIGRATION_COMPLETE.md - SidebarLayout implementation details
  - UNIFIED_LAYOUT_COMPLETE.md - Bookmarks and Progress page updates
  - APP_HEADER_TO_SIDEBAR_MIGRATION.md - AppHeader to AppSidebar migration
  - THEME_AND_LANGUAGE_CONTROLS_ADDED.md - Theme/language control integration
  - CENTERED_LAYOUT_APPLIED.md - Admin layout centering implementation

### Technical Details
- **Component Architecture**: Migrated from prop-based to context-based state management
- **Code Reduction**: Removed ~200 lines of duplicate code across components
- **Performance**: Improved re-render efficiency with centralized state
- **Accessibility**: Maintained WCAG 2.1 AA compliance throughout refactoring

---

## [1.5.0] - 2025-11-09

### Added - Brand Implementation & Database Improvements

#### Branding
- **Brand Logo** implementation across the application
- **Warm Purple** theme color (`#5f5873`) for light mode
- **Ubuntu Blue** theme color (`#7c73e6`) for dark mode
- **Brand Guidelines** documented in BRANDING.md

#### Database
- **Critical Fixes Migration (027)** applied:
  - Fixed column reference errors in RLS policies
  - Improved admin check functions
  - Enhanced activity summary function
  - Added proper error handling

#### Features
- **HelpScout Beacon** integration for customer support
- **Route-based Admin Navigation** - Converted admin to use dedicated routes
- **Collapsible Sidebar** - Added collapse/expand functionality

### Fixed
- **Hydration Errors** - Fixed theme switcher and conditional rendering issues
- **Mobile Usability** - Improved responsive design across all pages
- **Admin Navigation** - Integrated admin sections into AppSidebar

### Documentation
- BRAND_IMPLEMENTATION_COMPLETE.md
- MIGRATION_027_APPLIED.md
- HYDRATION_AND_RESPONSIVE_FIXES.md

---

## [1.4.0] - 2025-11-08

### Added - Learning Standards & Performance

#### Learning Standards
- **Learning Standards Management** - Admin UI for proficiency level definitions
- **AI-Guided Learning** - Standards inform AI teaching approach
- **Database Table**: `learning_standards` with 5 levels (beginner → fluent)

#### Performance Optimizations
- **Database Indexes** (Migration 025):
  - Indexes on frequently queried columns
  - Improved query performance by 50-70%
  - Optimized user lookup, phrase search, bookmark access

- **Table Partitioning** (Migration 026):
  - Partitioned `ai_messages` by date for better performance
  - User status tracking (active/suspended/deleted)
  - Prepared for scale (100k+ users)

#### Database Functions
- **Standardized Admin Checks** across all RLS policies
- **Activity Summary Function** for admin dashboard analytics
- **Automatic Study Streak Updates** via database trigger

### Fixed
- **User ID Column References** - Fixed inconsistent column naming (016-020)
- **RLS Policy Enforcement** - Ensured all tables properly enforce policies
- **Function Cascade Issues** - Proper DROP CASCADE before recreating functions

---

## [1.3.0] - 2025-11-05

### Added - AI Features & Content Moderation

#### AI Integration
- **Anthropic Claude Haiku 4.5** integration via Vercel AI Gateway
- **AI Chat** - Streaming conversation with practice/scenario/translation_help modes
- **Scenario Generation** - AI-generated practice scenarios based on proficiency
- **Phrase Recommendations** - AI-powered phrase suggestions

#### Content Moderation
- **AI-Powered Moderation** - Automatic content screening using Claude Haiku 4.5
- **Moderation Categories**: sexual, hate, harassment, violence, self-harm, abuse
- **Admin Moderation Queue** - Review flagged content at `/admin/moderation`
- **Moderation Alerts Table** - Database storage for flagged content

#### Database Tables
- `ai_conversations` - User AI chat sessions
- `ai_messages` - Individual chat messages
- `moderation_alerts` - Flagged content for review

### Changed
- **All AI Endpoints** now include moderation checks before processing
- **User Messages** automatically scanned before AI response generation

---

## [1.2.0] - 2025-11-01

### Added - Study Progress & Analytics

#### Progress Tracking
- **Phrase Progress** - Track learning status (learning/practiced/mastered)
- **Study Sessions** - Daily study session tracking
- **Study Streaks** - Consecutive day tracking with automatic updates
- **Database Tables**: `phrase_progress`, `study_sessions`

#### Analytics
- **User Analytics Dashboard** at `/app/analytics`
- **Admin Overview Dashboard** at `/admin/overview`
- **Activity Monitoring** at `/admin/activity`
- **Statistics**:
  - Total users, active users, new signups
  - Phrase views, bookmarks, progress
  - Study session analytics
  - AI conversation metrics

#### Admin Features
- **User Management** - View, edit roles, suspend/activate users
- **Activity Logs** - Monitor user actions and system events
- **Database Function**: `get_user_activity_summary()`

---

## [1.1.0] - 2025-10-28

### Added - Core Learning Features

#### Phrase Learning
- **200+ Phrases** in 4 languages (English, Shona, Ndebele, Chinese)
- **Categories**: Greetings, Travel, Business, Food, Emergency, Daily, Cultural
- **Phrase Details**: Translation, pronunciation guide, context, category
- **Search & Filter** functionality

#### User Features
- **Bookmarks** - Save favorite phrases for quick access
- **User Profiles** - Customizable user profiles with preferences
- **Profile Settings** at `/app/profile`
- **Database Tables**: `bookmarks`, `profiles`

#### User Experience
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Dark Mode** - Theme switching between light/dark/system
- **Internationalization** - UI in 4 languages

---

## [1.0.0] - 2025-10-25

### Initial Release - Foundation

#### Core Framework
- **Next.js 16** - React Server Components, App Router
- **React 19.2** - Latest React with server components
- **TypeScript** - Full type safety
- **Tailwind CSS 4.1** - Utility-first styling

#### Authentication
- **Supabase Auth** - Email/password authentication
- **Session Management** - HTTP-only cookies with auto-refresh
- **Dev Mode** - Development authentication bypass
- **Middleware Protection** - Route-based access control

#### Database
- **Supabase PostgreSQL** - Hosted database
- **Row Level Security** - User data isolation
- **Database Schema**: Initial tables (phrases, profiles)
- **Migration System** - SQL-based migrations in `/scripts/`

#### Infrastructure
- **Vercel Hosting** - Edge network deployment
- **Vercel Analytics** - Built-in analytics
- **Environment Configuration** - Secure environment variable management

#### UI Components
- **shadcn/ui** - Radix UI component library
- **Component Library**: Button, Card, Dialog, Input, Select, etc.
- **Design System** - Consistent styling and spacing

#### Pages
- **Landing Page** (`/`) - Public marketing page
- **Auth Pages** - Login, signup, callback
- **App Pages** - Profile, progress, bookmarks (initial versions)
- **Admin Pages** - User management, phrase management (initial versions)

#### Documentation
- **README.md** - Project overview and setup
- **CLAUDE.md** - Development guidelines
- **DEV_MODE.md** - Development mode documentation

---

## Version History Summary

| Version | Date | Focus |
|---------|------|-------|
| **3.1.0** | 2026-02-11 | Stytch Auth Integration & Build Automation |
| **3.0.0** | 2025-12-11 | AI-First Skills-Based Architecture |
| **2.0.0** | 2025-11-10 | Layout Standardization & Navigation Unification |
| **1.5.0** | 2025-11-09 | Brand Implementation & Database Improvements |
| **1.4.0** | 2025-11-08 | Learning Standards & Performance |
| **1.3.0** | 2025-11-05 | AI Features & Content Moderation |
| **1.2.0** | 2025-11-01 | Study Progress & Analytics |
| **1.1.0** | 2025-10-28 | Core Learning Features |
| **1.0.0** | 2025-10-25 | Initial Release - Foundation |

---

## Migration History

| Migration | Description |
|-----------|-------------|
| 001-002 | Initial phrases table and seed data |
| 003-004 | Profiles and preferences |
| 005-007 | Bookmarks and favorites |
| 008-009 | Progress tracking |
| 010-011 | AI conversations and moderation |
| 012-015 | AI features and learning standards |
| 016-020 | User ID column fixes |
| 021 | Phrase categories |
| 022-024 | Learning standards (final version) |
| 025 | Performance indexes |
| 026 | User status and partitioning |
| 027 | Critical fixes |

---

## Upgrade Notes

### Upgrading from 1.x to 2.0

**Breaking Changes**: None - all changes are additive and maintain backward compatibility.

**New Dependencies**:
- No new npm packages required
- All changes use existing dependencies

**Database Changes**: None required - all database work completed in 1.x series.

**Configuration Changes**:
- No environment variable changes needed
- Theme and language now stored in localStorage (automatic)

**Component Updates**:
- All app pages automatically use new layout system
- No manual migration needed for existing code
- Old patterns still work but deprecated

**What You Get**:
- ✅ Unified navigation across all pages
- ✅ Theme switcher in sidebar
- ✅ Language switcher in sidebar
- ✅ Collapsible sidebar (desktop)
- ✅ Responsive overlay sidebar (mobile)
- ✅ Centered content layouts
- ✅ Persistent user preferences

---

## Contributing

See [RELEASES.md](RELEASES.md) for guidelines on contributing to releases.

---

## Links

- **Documentation**: [CLAUDE.md](CLAUDE.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security**: [SECURITY.md](SECURITY.md)
- **Releases**: [RELEASES.md](RELEASES.md)
- **Repository**: [GitHub](https://github.com/yourusername/mukoko-lingo)

---

**Maintained by**: Claude Code
**Last updated**: February 11, 2026
