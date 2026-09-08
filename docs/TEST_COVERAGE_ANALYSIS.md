# Test Coverage Analysis

**Last measured**: September 2026 · **Framework**: Jest 29 + jest-expo
**Suites**: 45 · **Tests**: 510 · all passing

Regenerate the numbers below with `npm run test:coverage`. They are a snapshot,
not a contract — the contract is the threshold block in `package.json`.

## Where the numbers stand

| Metric | Threshold (`package.json`) | Actual | Margin |
|---|---|---|---|
| Statements | 47% | 51.6% | +4.6 |
| Branches | 42% | 45.8% | +3.8 |
| Functions | 43% | 45.0% | **+2.0** |
| Lines | 48% | 53.3% | +5.3 |

Functions is the tight one: two percentage points of headroom is roughly one
uncovered module away from a red build. Raise the thresholds when you add
coverage, or the ratchet does nothing.

### By area (statement coverage)

| Area | Coverage | Note |
|---|---|---|
| `lib/workos` | 100% | Redirect allowlist — security boundary, fully pinned |
| `lib/config` | 100% | API base URL resolution |
| `lib/data` | 94% | Phrase, question bank and translation integrity |
| `lib/hooks` | 89% | Language, theme, UI language |
| `lib/ai` | 70% | Client chat + moderation pre-check |
| `lib/auth` | 65% | AuthKit PKCE flow, both platforms |
| `lib/db` | 48% | Shape mappers covered; `identity.ts` not at all |
| `lib/services` | 43% | SRS, XP, daily lesson, api-client covered; the rest not |
| `lib/storage` | 41% | Web path covered, native path not |
| `components` | mixed | Learning components 49–95%; chrome and UI primitives 0% |

## The structural gap: `api/**` has no coverage floor

`collectCoverageFrom` includes only `lib/**` and `components/**`. Everything
else runs in CI but counts for nothing:

- **`api/**` (67 TypeScript modules)** — including every security boundary the
  app has: `auth-middleware.ts`, `chat-input.ts`, `tutor-prompt.ts`,
  `moderation.ts`, `ai-provider.ts`, `assessment-grading.ts`. These *are*
  tested (10 suites, listed in CLAUDE.md), and those tests are the reason the
  prompt-injection, moderation and grading work can be trusted — but nothing
  stops the next route from shipping with no test at all, because the
  thresholds cannot see it.
- **`app/**`** — every screen: auth flows, assessments, admin operations. No
  tests, no floor.
- **`scripts/**`** — the release automation is well covered (3 suites) purely
  by convention.

Fixing this is not a one-line change: adding `api/**` to `collectCoverageFrom`
drops the measured percentages immediately and the thresholds have to be reset
in the same commit. Worth doing deliberately, in a PR of its own, rather than
alongside a feature.

## What the suite actually protects

The listing in CLAUDE.md is the current index. The ones worth knowing by name:

| Suite | Property it pins |
|---|---|
| `api/_lib/__tests__/auth-middleware.test.ts` | `allowExpired` widens the expiry window **only** — never rescues a bad signature |
| `api/_lib/__tests__/chat-input.test.ts` | A client-supplied `system` role is rejected before it reaches a model |
| `api/_lib/__tests__/tutor-prompt.test.ts` | The prompt is built from stored proficiency; client scores are clamped |
| `api/ai/chat/__tests__/chat-route.test.ts` | **Every** turn is moderated, not just the newest; `max_tokens` clamped |
| `api/ai/__tests__/moderate-json.test.ts` | A reasoning model's `<think>` block cannot silently disable AI moderation |
| `api/_lib/__tests__/ai-provider.test.ts` | Workers AI wiring, the two-part config gate, the circuit breaker |
| `api/_lib/__tests__/jose-cjs.test.ts` | Guards the jose v6 ESM/CJS crash that once took sign-in down |
| `api/_lib/__tests__/logger.test.ts` | Request data reaches a log as an argument, never as a `util.format` template |
| `lib/workos/__tests__/config.test.ts` | Redirect allowlist, including the 172.16–172.31 private-range boundary |
| `lib/ai/__tests__/prompt-injection.test.ts` | Allowlists hold; no caller text reaches the prompt |
| `api/_lib/__tests__/assessment-grading.test.ts` | A score is computed from answers — a partial submission cannot claim 100%, and only a real assessment promotes a level |
| `api/assessments/__tests__/submit-route.test.ts` | The submit route rejects a caller-supplied `score`/`passed` |
| `scripts/release/__tests__/*` | The release automation cannot ship a hollow or half-bumped release |

## Gaps worth closing, in order

1. **`lib/db/identity.ts` (309 lines, 0%)** — the merge between shared
   `identity.persons` and Lingo's `learner_profiles`. Every authenticated
   request goes through it, and a bug here crosses user records. Highest value
   per test in the repo.
2. **`lib/storage/database.native.ts` (273 lines, 0%)** — the web path is
   covered and the native path is not, so iOS/Android storage divergence is
   invisible. The web suite is a ready-made template: mirror it.
3. **`lib/services/notifications.ts` (272 lines, 0%)** and `offline.ts` — both
   fail quietly by design, which is exactly the shape of bug tests catch and
   users do not report.
4. **`components/AppHeader.tsx` (87 statements, 0%)** — the one piece of chrome
   on every screen.
5. **Python analytics** — `api/analytics/tests/` covers helpers and imports;
   the four aggregation pipelines themselves are unpinned.

*Closed since the last measurement*: assessment grading, which used to happen
client-side with the route recording whatever score it was handed. It is now
computed in `api/_lib/assessment-grading.ts` and covered by 35 tests — none of
which move the coverage numbers below, because they live under `api/**`. That
is this document's first point, demonstrated: the app's newest security
boundary carries no coverage floor at all.

## Writing tests against `api/**`

**The mocking hazard.** Babel hoists `import` above `const mockX = jest.fn()`,
so a `jest.mock` factory that captures those bindings directly reads them in
their temporal dead zone. It fails in the worst possible way: the mock looks
applied, the keys are present, and every value is `undefined`. Have the factory
delegate instead, and mark it as ESM:

```ts
jest.mock('../../../_lib/moderation', () => ({
  __esModule: true,
  moderateUserContent: (...a: any[]) => mockModerateUserContent(...a),
}))
```

Modules that read `process.env` into consts at import time (`auth-middleware`,
`ai-provider`) need `jest.isolateModules` + `require` **after** the env is set —
see `loadProvider()` in `api/_lib/__tests__/ai-provider.test.ts`.

## Running

```bash
npm test                 # all suites
npm run test:watch       # watch mode
npm run test:coverage    # coverage report + threshold enforcement
npx jest --listTests     # the current suite inventory
npx jest api/_lib        # one directory
```

CI runs `npm test -- --ci --coverage` and uploads `coverage/` as an artifact for
seven days, so a threshold failure can be diagnosed without a re-run.
