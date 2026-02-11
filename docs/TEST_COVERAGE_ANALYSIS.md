# Test Coverage Analysis

**Date**: February 2026
**Test framework**: Jest 29 + jest-expo
**Test suites**: 8 passing | **Tests**: 87 passing

## Current Coverage (Jest --coverage)

| File | % Stmts | % Branch | % Funcs | % Lines | Uncovered Lines |
|------|---------|----------|---------|---------|-----------------|
| **All files** | **27.68** | **27.60** | **25.16** | **27.92** | |
| **lib/ai/** | **37.73** | **42.85** | **25.92** | **38.88** | |
| chat-service.ts | 60.41 | 63.63 | 60 | 60.41 | 57-103, 144, 150 |
| moderation.ts | 65.95 | 55 | 100 | 67.50 | 96-144 |
| skills-aware-prompts.ts | 0 | 0 | 0 | 0 | 18-307 |
| **lib/data/** | **93.75** | **73.33** | **91.66** | **95.65** | |
| assessment-questions.ts | 93.10 | 73.33 | 91.66 | 95 | 325 |
| phrases-data.ts | 100 | 100 | 100 | 100 | |
| translations.ts | 100 | 100 | 100 | 100 | |
| **lib/hooks/** | **25** | **23.33** | **25** | **24.70** | |
| useAdmin.ts | 0 | 0 | 0 | 0 | 17-98 |
| useLearningLanguage.tsx | 91.66 | 87.50 | 85.71 | 91.30 | 41, 52 |
| useTheme.tsx | 0 | 0 | 0 | 0 | 5-91 |
| **lib/storage/** | **36.36** | **31.25** | **36.84** | **40.74** | |
| database.native.ts | 0 | 0 | 0 | 0 | 6-240 |
| database.web.ts | 88.88 | 83.33 | 77.77 | 89.79 | 13-23 |
| **lib/supabase/** | **0** | **0** | **0** | **0** | |
| client.ts | 0 | 0 | 0 | 0 | 7-145 |
| **lib/types/** | **0** | **0** | **0** | **0** | |
| skills.ts | 0 | 0 | 0 | 0 | |
| **components/** | **0** | **0** | **0** | **0** | |
| (9 files) | 0 | 0 | 0 | 0 | all lines |

---

## Existing Test Suites

| Test File | Tests | What It Covers |
|-----------|-------|----------------|
| `lib/ai/__tests__/chat-service.test.ts` | 14 | Simulated responses, moderation gating, conversation starters |
| `lib/ai/__tests__/moderation.test.ts` | 14 | Local guardrails (phone, email, SSN, keywords), `getModerationMessage()` |
| `lib/data/__tests__/phrases-data.test.ts` | 10 | Phrase structure integrity, unique IDs, translations completeness |
| `lib/data/__tests__/assessment-questions.test.ts` | 14 | Question bank integrity, filtering, score calculation |
| `lib/data/__tests__/translations.test.ts` | 5 | UI translation keys across 5 languages |
| `lib/hooks/__tests__/useLearningLanguage.test.tsx` | 10 | Language state, persistence, fallback |
| `lib/storage/__tests__/database.test.ts` | 19 | Bookmarks, progress, skills, sessions, streaks (web/AsyncStorage only) |
| `components/__tests__/StyledText-test.js` | 1 | Snapshot test only |

---

## Gap Analysis: Where Coverage Is Missing

### Priority 1 - Core AI System (0% coverage, highest business impact)

**File**: `lib/ai/skills-aware-prompts.ts` (308 lines, 0% covered)

This is the brain of the AI tutor. It builds adaptive prompts based on user proficiency and is called for every AI interaction. None of its 10 functions are tested:

- `getUserSkillsProficiencyMap()` - Maps skill scores to proficiency levels
- `scoreToLevel()` - Converts numeric score (0-100) to level enum (beginner/elementary/intermediate/advanced/fluent)
- `calculateOverallProficiency()` - Averages across skills
- `getAITutorContext()` - Builds the full context object the AI reads
- `buildVocabularyGuidance()` / `buildGrammarGuidance()` / `buildScaffoldingGuidance()` / `buildErrorCorrectionGuidance()` - Each returns level-specific teaching instructions
- `buildConversationTypeGuidance()` - Returns guidance by conversation type
- `buildSkillSpecificNotes()` - Flags weak skills
- `buildSkillsAwarePrompt()` - Orchestrator that assembles the full system prompt

**Recommended tests**:
- `scoreToLevel()` boundary values: 0, 49, 50, 64, 65, 79, 80, 89, 90, 100
- `getUserSkillsProficiencyMap()` with empty skills (new user defaults), partial skills, full skills
- `getAITutorContext()` verifying `needs_improvement` flag logic (threshold at score < 65)
- `buildSkillsAwarePrompt()` for each conversation type and mixed proficiency levels
- `buildSkillSpecificNotes()` with all skills above threshold vs. some below
- Each guidance function with all 5 proficiency levels

**Why this matters**: If `scoreToLevel()` has an off-by-one error, a user with a score of 65 could get beginner-level teaching instead of intermediate. This directly degrades the learning experience with no visible error.

---

### Priority 2 - Authentication Layer (0% coverage, security-critical)

**File**: `lib/supabase/client.ts` (146 lines, 0% covered)

Every authenticated action flows through this file. It contains:

- `ExpoSecureStoreAdapter` - Custom storage adapter that switches between SecureStore (native) and AsyncStorage (web)
- `getSupabase()` - Lazy singleton with offline mode fallback
- `createClient()` - Throws when Supabase isn't configured
- Auth helpers: `signInWithEmail()`, `signUpWithEmail()`, `signOut()`, `getCurrentUser()`, `getSession()`, `resetPasswordForEmail()`, `updatePassword()`, `onAuthStateChange()`

**Recommended tests**:
- `getSupabase()` returns null when env vars are missing (offline mode)
- `getSupabase()` returns a singleton (same reference on repeated calls)
- `createClient()` throws with a clear message when not configured
- Each auth helper returns `{ data: null, error }` when Supabase is not configured
- `onAuthStateChange()` returns a noop unsubscribe when Supabase is not configured
- `ExpoSecureStoreAdapter` delegates to the correct storage backend per platform

**Why this matters**: The offline-mode fallback path (returning null/noop) is untested. A regression could crash the app on startup for any user without network.

---

### Priority 3 - Admin Role Hook (0% coverage, authorization-critical)

**File**: `lib/hooks/useAdmin.ts` (102 lines, 0% covered)

This hook gates all admin functionality. It has multiple state transitions and error paths:

- Initial loading state (`isLoading: true`)
- No authenticated user -> sets `isAuthenticated: false`
- User exists but profile fetch fails -> sets `error` but `isAuthenticated: true`
- User exists, profile fetched, role check -> `isAdmin: profile.role === 'admin'`
- Auth state change subscription and cleanup

**Recommended tests**:
- Mock `createClient()` to return a mock Supabase client
- Test unauthenticated state (no user from `getUser()`)
- Test authenticated non-admin (profile with `role: 'user'`)
- Test authenticated admin (profile with `role: 'admin'`)
- Test profile fetch error (authenticated but can't verify role)
- Test auth error (e.g., expired token)
- Test `refresh()` callback re-checks status
- Test cleanup of auth state subscription on unmount

**Why this matters**: If the admin check silently fails and defaults to `isAdmin: false`, admin users lose access. If it defaults to `true` on error, regular users gain admin access.

---

### Priority 4 - Native Storage (0% coverage, data loss risk)

**File**: `lib/storage/database.native.ts` (241 lines, 0% covered)

The web storage (`database.web.ts`) is well-tested at 89% coverage, but the native SQLite implementation shares the same interface with completely different internals. It uses raw SQL queries for:

- Database initialization with `CREATE TABLE IF NOT EXISTS` for 4 tables
- Bookmark CRUD with `INSERT OR IGNORE`, `DELETE`, `SELECT`
- Progress tracking with `INSERT OR REPLACE`
- Skills tracking with `INSERT OR REPLACE`
- Study sessions with `INSERT` and streak calculation via date comparison

**Recommended tests**:
- Use an in-memory SQLite mock (e.g., `better-sqlite3` or `sql.js`)
- Mirror every test from `database.test.ts` against the native implementation
- Test SQL edge cases: special characters in phrase IDs, concurrent writes
- Test `initDatabase()` creates all 4 tables
- Test study streak calculation across date boundaries

**Why this matters**: The web and native implementations could silently diverge. A user's bookmarks or progress could work on web but fail on mobile (or vice versa) with no test catching it.

---

### Priority 5 - Partially Tested: Chat Service Real API Path (60% coverage)

**File**: `lib/ai/chat-service.ts` (192 lines, 60.41% covered)

The existing tests only cover the simulated mode (no API key set). The untested lines (57-103) are the real API call path:

- Message formatting for the Anthropic API (`filter` + `map` on messages)
- `fetch()` call with proper headers (`x-api-key`, `anthropic-version`)
- HTTP error handling (non-200 responses)
- Response parsing (`data.content?.[0]?.text`)
- Empty response detection
- Error fallback (returns friendly error message when API key exists but call fails)

**Recommended tests**:
- Mock `fetch` with a successful Anthropic API response structure
- Test that system messages are filtered out and only user/assistant messages are sent
- Test API error (non-200 status) returns the fallback error message
- Test empty `content` array throws and triggers fallback
- Test network failure with API key set returns connectivity error (not simulated response)

**Why this matters**: The simulated mode is a demo fallback. In production, all users go through the real API path, which is entirely untested. Any regression in message formatting or response parsing would break the AI tutor for all production users.

---

### Priority 6 - Partially Tested: AI Moderation API Path (66% coverage)

**File**: `lib/ai/moderation.ts` (187 lines, 67.5% covered)

Local guardrails are well-tested. The untested code (lines 96-144) is `checkAIModeration()`:

- The entire Claude API call for nuanced content checking
- JSON parsing of the moderation response
- Handling of malformed responses (no JSON match)
- API failures returning `null` (fail-open design)

**Recommended tests**:
- Mock `fetch` with a flagged AI moderation response
- Mock `fetch` with a clean AI moderation response
- Test malformed response (no JSON) returns `null`
- Test API failure returns `null` (graceful degradation)
- Test the fail-open design: when AI moderation fails, content passes through

**Why this matters**: The fail-open design is intentional, but untested. If the AI moderation API changes its response format, the regex `text.match(/\{[\s\S]*\}/)` could silently break and all AI moderation would silently stop working.

---

### Priority 7 - Theme Hook (0% coverage, UX impact)

**File**: `lib/hooks/useTheme.tsx` (92 lines, 0% covered)

Lower priority since it's a UX concern rather than data or security, but it manages theme state persistence and system appearance detection.

**Recommended tests**:
- Default theme selection
- Theme persistence to AsyncStorage
- System theme detection and response

---

### Priority 8 - Component Tests (0% coverage)

**File**: `components/AppHeader.tsx` (528 lines, 0% covered) and 8 other component files

The Jest configuration collects coverage from `components/**/*.{ts,tsx}`, but only a single snapshot test exists. No component behavior is tested.

**Recommended tests** (highest-value components first):
- `AppHeader.tsx` - Navigation rendering, admin link visibility, active route highlighting
- `Themed.tsx` - Theme-aware styling application

Note: Screen/page-level tests (`app/` directory) are outside the current coverage collection scope. Consider adding integration or E2E tests for critical flows (auth, assessment, admin operations) separately.

---

## Structural Observations

### 1. Tests Only Cover Simulated/Offline Paths

Both `chat-service.test.ts` and `moderation.test.ts` set `EXPO_PUBLIC_ANTHROPIC_API_KEY = ''` in `beforeEach`, which means they only test the no-API fallback paths. The production code paths (real Anthropic API calls) at `chat-service.ts:57-103` and `moderation.ts:96-144` are never exercised.

### 2. Skills-Aware Prompts Are Mocked Away in Chat Tests

`chat-service.test.ts` mocks `buildSkillsAwarePrompt` to return a static string. This means the integration between the chat service and the adaptive prompting system is never tested. A breaking change in `skills-aware-prompts.ts` would not cause chat service tests to fail.

### 3. Native Storage Implementation Has Zero Coverage

`database.native.ts` (241 lines of SQLite queries) has 0% coverage while `database.web.ts` has 89%. These implement the same interface but with completely different internals (AsyncStorage JSON vs. SQLite SQL). There is no test ensuring they behave identically.

### 4. Coverage Config Excludes App Screens

The Jest `collectCoverageFrom` config only includes `lib/**` and `components/**`. The `app/` directory (which contains ~13,000 lines of screen code including auth flows, assessments, and admin operations) is excluded from coverage metrics entirely.

### 5. No Integration Tests

All 87 tests are unit tests with mocked dependencies. There are no tests that verify:
- The chat service correctly uses the skills-aware prompt builder
- Moderation correctly blocks messages before they reach the AI
- The auth flow from login to protected page
- Assessment completion updating user skills

---

## Recommended Test Roadmap

### Phase 1: Core Logic (Highest ROI)

| Target | New Tests (est.) | Impact |
|--------|-----------------|--------|
| `skills-aware-prompts.ts` | ~20-25 tests | Covers the AI adaptation engine |
| `client.ts` (supabase) | ~10-12 tests | Covers auth and offline fallbacks |
| `useAdmin.ts` | ~8-10 tests | Covers admin authorization |

**Expected coverage improvement**: 27% -> ~45% statement coverage

### Phase 2: Platform Parity & API Paths

| Target | New Tests (est.) | Impact |
|--------|-----------------|--------|
| `database.native.ts` | ~19 tests (mirror web) | Ensures native/web parity |
| `chat-service.ts` (API path) | ~6-8 tests | Covers production AI calls |
| `moderation.ts` (API path) | ~5-6 tests | Covers production moderation |

**Expected coverage improvement**: 45% -> ~65% statement coverage

### Phase 3: UI & Integration

| Target | New Tests (est.) | Impact |
|--------|-----------------|--------|
| `useTheme.tsx` | ~5 tests | Theme persistence |
| `AppHeader.tsx` | ~5-8 tests | Navigation behavior |
| Integration tests | ~5-10 tests | Cross-module verification |

**Expected coverage improvement**: 65% -> ~75% statement coverage
