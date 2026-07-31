# Ecosystem Data Migration — Plan

**Status:** in progress. Done so far: `identity.persons` cutover (PR #24), `DB_NAME` fixed from the invented `mukoko-lingo` to the real `lingo` database, phrase content gaps backfilled (scenario links, difficulty reclassification, new intermediate-level content), Lingo's categories re-homed onto real `engagement.tags`, and indexes created on Lingo's own operational collections. Still open: the app's read/write paths (`api/phrases/*`, `lib/data/phrases-data.ts`, etc.) haven't been repointed at the real data yet — see Phase 2.
**Context:** the earlier MongoDB migration (Supabase → Mongo) invented a full parallel schema in a Lingo-only `mukoko-lingo` database. A live inspection of the shared cluster (see below) shows most of that data already has a real, populated, shared home — and in three cases (`lingo.phrases`, `shamwari.guardrails`, plus the `identity.persons` fix already shipped) **the platform-level migration into the shared schema has already happened**. The app just isn't reading from it.

This doc inventories what's real, what's still genuinely Lingo-only, what's missing outright, and proposes a phased plan.

## Progress log (MongoDB-side work done directly via the MongoDB MCP, ahead of the app-code phases below)

- **`DB_NAME` fixed**: `lib/db/mongo.ts` now points at `lingo`, never the empty, invented `mukoko-lingo`. Lingo's operational collections (`bookmarks`, `phrase_progress`, `learner_profiles`, etc.) now live in the real shared `lingo` database, indexed (see below), ready for real writes.
- **Scenario content gaps closed** where the corpus honestly supports it: linked `health`/`food`/`shopping` categories (0 links → 20/25/32), and individually linked the on-topic subset of `tourism` phrases to `getting-around`/`arrival-immigration`/`checking-in`/`market-shopping`/`eating-out`. Authored 16 new phrases (8 negotiation, 8 client-dining, EN/SN/ND/ZH) to fill `meetings-negotiation` and `business-dining`, which had zero matching content in the existing corpus.
- **Difficulty reclassified** by actual linguistic judgment (not word-count): `beginner` 249→189, `elementary` 17→86, `intermediate` 0→16. True `advanced`/`fluent` content (idioms/proverbs) still doesn't exist in the corpus — `contentType` is 100% `"phrase"`, zero `idiom`/`proverb`/`sentence` — flagged as a real content gap, not fabricated.
- **Categories re-homed**: created 13 tags in `engagement.tags` under the existing `"languages-learning"` interest category (previously **zero** — all 275 existing tags were `sourceProject: "news"`). Every phrase now carries a `tags` array alongside the legacy `category` field.
- **Live views, not static counters**: `lingo.scenariosLive` and `lingo.tagCountsLive` are aggregation-backed views recomputed on every query. The stored `scenarios.phraseCount` field is left alone (required by the shared schema validator) but should not be trusted going forward — query the views instead. Note `$lookup` can't cross databases, so `tagCountsLive` lives in `lingo` (where the phrases are); a consumer joins it with `engagement.tags` metadata at the app layer.
- **Engagement encryption reality-checked**: `engagement.reactions`/`comments`/`interactions`/`ratings`/`reviews`/`followActions` are **empty across the entire cluster** — this E2E-encrypted layer is designed but unimplemented anywhere, not a Lingo-specific gap. By contrast `campfire.reactions` (a real, shipped feature) is plain/unencrypted — personId + emoji key, no ciphertext — even though `campfire.messages` does real E2E (MLS/Megolm). Conclusion: encrypt content, not engagement signals; matches how TikTok/WeChat separate message encryption from (unencrypted) likes/views/saves telemetry. Decision: Lingo's bookmarks/views should be plain collections owned by `lingo` (mirroring `campfire.reactions`'s own-domain pattern), not attached to the unbuilt encrypted `engagement.interactions` layer.
- **Indexes created** on `lingo`'s Lingo-owned operational collections (`learner_profiles`, `phrase_progress`, `srs_cards`, `user_xp`, `bookmarks`, `user_skills`, `assignment_submissions`, `class_memberships`, `phrase_views`, `xp_events`, `study_sessions`) — `scripts/create-indexes.ts` updated to match and no longer touches the shared `phrases` collection (which owns its own indexes already).

---

## 1. What's real vs. what the app built

| Domain | App built (this repo) | Shared reality (cluster) | Status |
|---|---|---|---|
| User identity | `profiles` (invented, ObjectId) | `identity.persons` (UUID, OIDC claims, `workosUserId`) | **Fixed in PR #24** — routes now read/write `identity.persons` + a `learner_profiles` extension |
| Phrases | `lib/data/phrases-data.ts`, flat fields (`english`/`shona`/…) | `lingo.phrases` — **266 docs**, real schema (`translations[]`, `cefrLevel`, `scenarioIds`, `schemaOrg`), every doc tagged `mukoko.sourceProject: "lingo"` | **Already migrated at the platform level.** App has never read it. |
| Languages | Hardcoded in `translations.ts` | `lingo.languages` — 4 docs (en/sn/nd/zh, BCP-47 + ISO 639-3) | Real, unread |
| Scenarios / topics | `category` string on each phrase | `lingo.scenarios` — 10 docs (Arrival & Immigration, Getting Around, …), CEFR range, can-do goals | Real, unread — richer than app's flat `category` |
| Proficiency framework | `learning_standards` collection, ad hoc levels | `lingo.frameworks` (CEFR) + `lingo.standards` (A1–C2, can-do summaries) + `lingo.learningStandards` (4 docs, AI-prompt templates per level) | Real, unread — should drive `skills-aware-prompts.ts` |
| Content moderation | `guardrails` collection (6 categories) | `shamwari.guardrails` — **6 docs, every one tagged `mukoko.sourceProject: "lingo"`, `isCore: true`** | **Already migrated at the platform level.** Same data, different (correct) home. |
| AI chat (Shamwari) | `ai_conversations` (messages embedded) | `shamwari.conversations` + `shamwari.messages` (separate collections, `surfaceContext`, `shamwari.conversationContext`/`retrievalState` sub-object built for exactly this) | Real, unused — no Lingo conversations exist there yet (0 docs) |
| Bookmarks / views / likes | `bookmarks`, `phrase_views` | `engagement.interactions` (`interactionType: bookmark/view/…`) + `engagement.reactions`/`comments` — **both explicitly list `"lingo_phrase"` as a valid `targetReferenceType`** | Schema ready, **0 docs** — nothing wired up yet, net-new integration work |
| XP / streaks / leaderboard | `user_xp`, `xp_events`, `study_sessions` + ad hoc weekly leaderboard | `ubuntu.contributions` (`sourceDomain` enum **includes `"lingo"`**) + `ubuntu.scoreSnapshots` + `ubuntu.leaderboardDefinitions` | Schema ready, **0 lingo docs**, and `leaderboardDefinitions`/`badges`/`missions` are **empty ecosystem-wide** (see §3) |
| API keys (OneRoster/dev) | `api_keys` collection | `platform.apiKeys` (org-scoped, `ownerEntityId`, `keyType: internal/external`) | Schema ready, 0 docs, unused |
| Classes / assignments / SRS | `classes`, `class_memberships`, `assignments`, `srs_cards` | **No ecosystem equivalent anywhere in the cluster.** | Genuinely Lingo-only — keep local |
| Skills proficiency (Pronunciation/Vocabulary/…) | `skills`, `user_skills` (0–100 score) | `identity.personSkills` exists but is a **different concept** — LinkedIn-style professional skill endorsements (`proficiencyLevel: beginner…master`, ISCO code, `endorsementCount`). Confirmed empty, confirmed not the same thing. | Genuinely Lingo-only — do **not** conflate with `identity.personSkills` |

Also confirmed: `lingo.phrases` already carries a `creatorEntityId` pointing at a real, pre-existing **Mukoko Lingo product entity** in `entity.entities` (`slug: mukoko-lingo`, `ecosystemRole: product`, `schemaOrgType: EducationalOrganization`, parented under the Mukoko pillar entity). Any new content Lingo's admin UI creates should stamp this same `creatorEntityId`, not a fabricated one.

---

## 2. Why this matters (concrete symptoms today)

- Admins editing "phrases" in the Lingo admin UI are editing a **local seed array**, invisible to the rest of the platform and to the 266 real phrases already curated in `lingo.phrases`.
- Moderation guardrails were already migrated to `shamwari.guardrails` — the app's local `guardrails` collection is now **stale, disconnected duplicate config** that could silently drift from the canonical policy.
- Shamwari AI conversations recorded by Lingo don't show up anywhere else in the ecosystem (cross-surface AI memory, unified conversation history, admin oversight tooling built against `shamwari.*` all miss Lingo entirely).
- Phrase bookmarks/likes never reach the shared engagement graph, so Lingo content can't surface in cross-app "trending" or interest-based discovery even though `engagement.interestCategories` already has a `"Languages & Learning"` category ready to receive it.
- XP/streaks are invisible to the platform-wide Ubuntu trust/gamification system, even though `ubuntu.contributions.sourceDomain` was built with `"lingo"` as a first-class value.

---

## 3. What's missing in MongoDB (gaps, not just unread data)

Things that are **actually absent**, not merely unused by the app:

1. **`ubuntu.badges`, `ubuntu.missions`, `ubuntu.leaderboardDefinitions` are empty collections, ecosystem-wide** — not a Lingo gap, a platform gap. There is no seeded leaderboard definition for any surface yet, so even after wiring Lingo into `ubuntu.contributions`, there's nothing to compute a leaderboard *from* until at least one `leaderboardDefinitions` doc exists (e.g. `metric: contribution_count`, `filters: { sourceDomain: 'lingo' }`).
2. **No language-learning-specific Ubuntu badges** (e.g. "First 100 Phrases", "7-Day Streak") — would need to be authored net-new in `ubuntu.badges` with `category: "cultural"` or a case for adding `"education"`/`"language"` to that enum (currently: civic/creative/commercial/care/cultural/factual/verification/platform — language learning doesn't map cleanly onto any of them).
3. **No `platform.apiKeys` docs for Lingo's OneRoster/dev integrations** — the collection exists and is schema-ready but nothing has ever been issued through it; Lingo's local `api_keys` collection would need a one-time cutover.
4. **No indexes yet on any of Lingo's own local collections** (`learner_profiles`, `phrase_progress`, `bookmarks`, `srs_cards`, etc.) — the `mukoko-lingo` database doesn't exist on the cluster at all yet (zero collections, confirmed live). `scripts/create-indexes.ts` needs to actually run once the app starts writing there for real.
5. **`lingo.phrases` scenario linkage is sparse** — most of the 10 seeded scenarios show `phraseCount: 0` (only 2 of 10 have any phrases attached: "Getting Around" and "Money, Mobile Money & Bargaining", 12 each). If the app is going to organize learning by scenario, most scenario→phrase mappings still need to be authored.
6. **Only 1 framework (CEFR), 7 standards levels, 4 `learningStandards` docs** exist — thin relative to what the app's `skills-aware-prompts.ts` currently encodes (5 proficiency levels: Beginner/Elementary/Intermediate/Advanced/Fluent, each with its own AI-prompt guidance). The CEFR-based `learningStandards` would need to either replace or be reconciled with the app's existing 5-level model before `skills-aware-prompts.ts` can be pointed at it.
7. **No `entity.memberships` row for the Mukoko Lingo product entity's classes/orgs** — if `classes`/`organization_enrollments` are ever meant to plug into the real `entity`/`entity.memberships` model (e.g. a school as an `entity`, teachers/students as `memberships`), that mapping doesn't exist yet and would be new modeling work, not a migration of existing data.

Nothing indicates a **broken** index or a validator gap on the collections we'd actually use — `lingo.phrases` has sensible indexes already (`category+difficulty+isActive`, `translations.languageTag`, `scenarioIds+cefrLevel`), and `identity.persons` is well-indexed for our lookup patterns (`workosUserId`, `email`, `_id`).

---

## 4. Proposed phased plan

Ordered by risk/effort, each phase independently shippable and reviewable.

### Phase 0 — done
`identity.persons` + `learner_profiles` (shipped in PR #24).

### Phase 1 — Guardrails (low risk, high value, small diff)
Point `lib/ai/moderation.ts` at `shamwari.guardrails` (filter `mukoko.sourceProject: "lingo"` or just `isCore: true` + `appliesTo` empty/matching) instead of the local `guardrails` collection. Delete the local collection's write path (admin UI keeps working read-only against the shared collection, or gets removed if guardrail editing becomes a shamwari-side concern). Lowest-risk phase: same 6 categories, same shape, just the real source.

### Phase 2 — Phrases, languages, scenarios, standards (biggest, most valuable)
Repoint all phrase read paths (`api/phrases/*`, admin phrase CRUD, the mobile/web phrase browser) at `lingo.phrases`/`lingo.languages`/`lingo.scenarios`/`lingo.standards`/`lingo.learningStandards`. Requires:
- A `translations[]` → the app's current flat-field API response shape adapter (or a client-side shape change — bigger blast radius, needs a call).
- Deciding what to do with `lib/data/phrases-data.ts` (200 phrases) vs. the real 266 — likely retire the local seed entirely once cutover is verified.
- Filling scenario→phrase gaps (8 of 10 scenarios currently have 0 phrases) if the UI is going to organize by scenario.
- Reconciling the app's 5-level (Beginner…Fluent) proficiency model against CEFR's 6-level (A1–C2) `learningStandards` — needs a decision, not just code.

### Phase 3 — Shamwari AI conversations
Move `ai_conversations` reads/writes to `shamwari.conversations` + `shamwari.messages`, tagging `surfaceContext: 'mukoko_lingo'`. Unlocks cross-surface AI conversation history and brings Lingo under the shared `toolUsage`/moderation oversight.

### Phase 4 — Engagement (bookmarks/views/likes)
Move `bookmarks`/`phrase_views` to `engagement.interactions` (`interactionType: bookmark|view`, `targetReferenceType: lingo_phrase`). Note: `engagement.*` collections use **E2E-encrypted, pseudonymous** payloads (`ciphertext`, `encryptionEnvelope`, `recipientKeyRefs`) — this is a materially bigger lift than a flat collection swap; needs its own design pass on key management before implementation, not just a query rewrite.

### Phase 5 — Ubuntu gamification (XP/streaks/leaderboard)
Feed study activity into `ubuntu.contributions` (`sourceDomain: "lingo"`, `category: "cultural"` fits best of the existing enum). Blocked on ecosystem-level seeding of `ubuntu.leaderboardDefinitions` (currently empty everywhere) — needs at least one definition doc before a leaderboard can be computed from it. Badges/missions for language milestones would be net-new content, not a migration.

### Phase 6 — API keys
Cut `api_keys` (OneRoster/dev access) over to `platform.apiKeys`. Lowest urgency — zero current usage either side.

**Not planned:** `classes`/`assignments`/`srs_cards`/`user_skills`/`assessments` stay Lingo-local — confirmed no ecosystem equivalent exists.

---

## 5. Open questions before starting Phase 2+ (the big one)

1. Does the phrase API response shape change for clients (`translations[]`) or does the API adapt `lingo.phrases` back into the current flat `{english, shona, ndebele, chinese}` shape to avoid a client rewrite?
2. Who owns reconciling the 5-level (Beginner–Fluent) proficiency model against CEFR's A1–C2 — product decision, not engineering.
3. Does Lingo get write access to `lingo.phrases`/`scenarios` for its own admin CRUD, or does content authoring move to a different shared admin surface?
4. For Phase 4 (engagement), who designs the E2E key-management story — this is the single biggest scope item in the whole plan.

Recommend tackling **Phase 1 (guardrails)** first — it's a same-shape swap with no client-visible change and immediately closes a drift risk (the local guardrails collection could silently diverge from the canonical, already-migrated one).
