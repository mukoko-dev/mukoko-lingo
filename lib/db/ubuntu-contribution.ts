/**
 * Phase 5 — Ubuntu gamification enrichment.
 *
 * Maps a synced `xp_events` document onto a `ubuntu.contributions` document
 * (the shared, ecosystem-wide trust/gamification ledger — `ubuntu` database,
 * `sourceDomain: "lingo"`). This is a best-effort, non-blocking side write:
 * Lingo's own XP/level state (`user_xp`/`xp_events`) remains the source of
 * truth for the app's own UI. See `docs/ECOSYSTEM_DATA_MIGRATION.md` §Phase 5
 * for why a leaderboard/badges/missions are explicitly out of scope here
 * (`ubuntu.leaderboardDefinitions`/`badges`/`missions` are empty
 * ecosystem-wide — nothing to compute from yet, for any app).
 */

import { randomUUID } from 'crypto'
import { MUKOKO_LINGO_ENTITY_ID } from './types'
import type { Person, UbuntuContribution, XpEvent } from './types'

/** Weight bounds enforced by the `ubuntu.contributions` schema validator. */
const MIN_WEIGHT = 0.1
const MAX_WEIGHT = 10.0

/**
 * Map a Lingo XP amount onto the shared `weight` field (typically
 * 0.1–10.0). Lingo's XP amounts run small-integer scale (a few XP for a
 * phrase practiced, tens for a completed quiz/session) — dividing by 10
 * lands ordinary events in the 0.1–a few range while still letting a big
 * one-off award (e.g. a 100 XP streak bonus) reach the top of the shared
 * scale. Clamped to the schema's documented bounds so an unusually large
 * or a zero/negative amount never produces an invalid document.
 */
export function xpAmountToWeight(amount: number): number {
  if (!Number.isFinite(amount)) return MIN_WEIGHT
  const scaled = amount / 10
  return Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, scaled))
}

/**
 * The contributor's owning entity — a Family/household entity if the
 * person has one linked (`identity.persons.bundu.defaultFamilyEntityId`),
 * otherwise the Mukoko Lingo product entity itself. Mirrors the fallback
 * this migration already uses for `Phrase.creatorEntityId` (see
 * `phrase-shape.ts`) for the same "no real per-user entity yet" ambiguity.
 */
export function resolveContributorEntityId(person: Pick<Person, 'bundu'> | null | undefined): string {
  return person?.bundu?.defaultFamilyEntityId || MUKOKO_LINGO_ENTITY_ID
}

/**
 * Build a schema-compliant `ubuntu.contributions` document for one synced
 * XP event. `sourceRecordId` must be the real `xp_events` document `_id`
 * just inserted — a dereferenceable pointer, not a placeholder.
 */
export function buildUbuntuContribution(params: {
  contributorPersonId: string
  contributorEntityId: string
  xpEventId: string
  xpEvent: Pick<XpEvent, 'source' | 'amount' | 'created_at'>
}): UbuntuContribution {
  const { contributorPersonId, contributorEntityId, xpEventId, xpEvent } = params
  const now = new Date()

  return {
    _id: randomUUID(),
    _schemaVersion: 'v3.1',
    contributorPersonId,
    contributorEntityId,
    contributionType: xpEvent.source || 'xp_event',
    sourceDomain: 'lingo',
    sourceRecordId: xpEventId,
    category: 'cultural',
    weight: xpAmountToWeight(xpEvent.amount),
    occurredAt: xpEvent.created_at || now,
    createdAt: now,
  }
}
