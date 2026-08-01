/**
 * Person + LingoProfile merge layer.
 *
 * `identity.persons` is the shared, ecosystem-wide user record (owned by
 * the identity domain, not Lingo) — Lingo upserts into it on sign-in but
 * never invents its own parallel user table. `learner_profiles` is Lingo's
 * own extension collection for fields the shared schema has no room for
 * (app role, learning preferences, push tokens), keyed on `person_id`.
 *
 * Routes should go through the helpers here rather than touching
 * `persons()` / `lingoProfiles()` directly, so the two collections stay in
 * sync and every route presents the same merged shape to API clients.
 */

import { randomUUID } from 'crypto'
import { persons, lingoProfiles } from './collections'
import type { Person, LingoProfile } from './types'
import { MUKOKO_LINGO_ENTITY_ID } from './types'

export interface MergedProfile {
  id: string
  workos_user_id: string | null
  email: string | null
  display_name: string
  role: 'user' | 'admin'
  status: 'active' | 'inactive' | 'banned' | 'pending'
  created_at: Date
  last_active?: Date
  deleted_at?: Date | null
  preferred_ui_language?: string
  learning_goal?: string
  daily_goal?: number
  push_token?: string
  push_token_platform?: string
  push_token_updated_at?: Date
  last_study_date?: string
}

function displayName(person: Person): string {
  return person.name || person.givenName || person.email?.split('@')[0] || 'Learner'
}

function merge(person: Person, profile: LingoProfile | null): MergedProfile {
  return {
    id: person._id,
    workos_user_id: person.workosUserId ?? null,
    email: person.email,
    display_name: displayName(person),
    role: profile?.role || 'user',
    status: profile?.status || 'active',
    created_at: profile?.created_at || person.createdAt,
    last_active: profile?.last_active,
    deleted_at: profile?.deleted_at,
    preferred_ui_language: profile?.preferred_ui_language,
    learning_goal: profile?.learning_goal,
    daily_goal: profile?.daily_goal,
    push_token: profile?.push_token,
    push_token_platform: profile?.push_token_platform,
    push_token_updated_at: profile?.push_token_updated_at,
    last_study_date: profile?.last_study_date,
  }
}

/**
 * Find-or-create a person keyed on the stable WorkOS user id (not email,
 * which can change) — atomic upsert against identity.persons, then a
 * matching learner_profiles row created on first sign-in.
 */
export async function findOrCreatePersonFromWorkOS(workosUser: {
  id: string
  email: string
  firstName?: string | null
  lastName?: string | null
}): Promise<MergedProfile> {
  const personsCol = await persons()
  const now = new Date()

  const person = await personsCol.findOneAndUpdate(
    { workosUserId: workosUser.id },
    {
      $set: { lastSeenAt: now, updatedAt: now },
      $setOnInsert: {
        _id: randomUUID(),
        _schemaVersion: 'v3.1',
        workosUserId: workosUser.id,
        email: workosUser.email,
        emailVerified: true,
        phoneNumberVerified: false,
        givenName: workosUser.firstName ?? null,
        familyName: workosUser.lastName ?? null,
        name: workosUser.firstName
          ? [workosUser.firstName, workosUser.lastName].filter(Boolean).join(' ')
          : null,
        isActive: true,
        createdAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  )

  if (!person) {
    throw new Error('Failed to find or create person')
  }

  const profilesCol = await lingoProfiles()
  const profile = await profilesCol.findOneAndUpdate(
    { person_id: person._id },
    {
      $set: { last_active: now },
      $setOnInsert: {
        person_id: person._id,
        role: 'user',
        status: 'active',
        created_at: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  )

  return merge(person, profile)
}

export async function getMergedProfile(personId: string): Promise<MergedProfile | null> {
  const [personsCol, profilesCol] = await Promise.all([persons(), lingoProfiles()])
  const person = await personsCol.findOne({ _id: personId })
  if (!person) return null
  const profile = await profilesCol.findOne({ person_id: personId })
  return merge(person, profile)
}

export async function getMergedProfileByEmail(email: string): Promise<MergedProfile | null> {
  const [personsCol, profilesCol] = await Promise.all([persons(), lingoProfiles()])
  const person = await personsCol.findOne({ email })
  if (!person) return null
  const profile = await profilesCol.findOne({ person_id: person._id })
  return merge(person, profile)
}

/** Patch Lingo-local fields only (role/status/preferences/push token/etc). */
export async function updateLingoProfile(
  personId: string,
  patch: Partial<Omit<LingoProfile, '_id' | 'person_id' | 'created_at'>>
): Promise<MergedProfile | null> {
  const [personsCol, profilesCol] = await Promise.all([persons(), lingoProfiles()])
  const person = await personsCol.findOne({ _id: personId })
  if (!person) return null

  const profile = await profilesCol.findOneAndUpdate(
    { person_id: personId },
    {
      $set: patch,
      $setOnInsert: { person_id: personId, role: 'user', status: 'active', created_at: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  )

  return merge(person, profile)
}

export async function touchLastActive(personId: string): Promise<void> {
  const profilesCol = await lingoProfiles()
  await profilesCol.updateOne(
    { person_id: personId },
    {
      $set: { last_active: new Date() },
      $setOnInsert: { person_id: personId, role: 'user', status: 'active', created_at: new Date() },
    },
    { upsert: true }
  )
}

/** Total learner_profiles matching a Lingo-local filter — for admin stats. */
export async function countLingoProfiles(filter: Record<string, any> = {}): Promise<number> {
  const profilesCol = await lingoProfiles()
  return profilesCol.countDocuments({ deleted_at: null, ...filter })
}

/**
 * The N most-recently-created profiles, merged with their identity.persons
 * record — used by the admin activity feed.
 */
export async function recentMergedProfiles(since: Date, limit: number): Promise<MergedProfile[]> {
  const [personsCol, profilesCol] = await Promise.all([persons(), lingoProfiles()])
  const recentProfiles = await profilesCol
    .find({ created_at: { $gte: since } })
    .sort({ created_at: -1 })
    .limit(limit)
    .toArray()
  if (recentProfiles.length === 0) return []

  const personDocs = await personsCol
    .find({ _id: { $in: recentProfiles.map((p) => p.person_id) } })
    .toArray()
  const personById = new Map(personDocs.map((p) => [p._id, p]))

  return recentProfiles
    .map((profile) => {
      const person = personById.get(profile.person_id)
      return person ? merge(person, profile) : null
    })
    .filter((p): p is MergedProfile => p !== null)
}

/** Display names for a set of person ids — used by the leaderboard. */
export async function getDisplayNames(personIds: string[]): Promise<Record<string, string>> {
  if (personIds.length === 0) return {}
  const personsCol = await persons()
  const personDocs = await personsCol.find({ _id: { $in: personIds } }).toArray()
  const names: Record<string, string> = {}
  for (const person of personDocs) names[person._id] = displayName(person)
  return names
}

/**
 * The owning entity for a shamwari conversation is required by the shared
 * schema, but per-person "family" entity auto-provisioning (Rule 10) isn't
 * implemented anywhere in the ecosystem yet — most persons have no
 * `bundu.defaultFamilyEntityId`. Fall back to the Mukoko Lingo product
 * entity when absent; see the Phase 3 PR description for the known
 * simplification this represents.
 */
export async function resolveOwnerEntityId(personId: string): Promise<string> {
  const personsCol = await persons()
  const person = await personsCol.findOne({ _id: personId })
  return person?.bundu?.defaultFamilyEntityId || MUKOKO_LINGO_ENTITY_ID
}

/** Resolve a person id from an email — used by class-roster and OneRoster sync. */
export async function findPersonIdByEmail(email: string): Promise<string | null> {
  const personsCol = await persons()
  const person = await personsCol.findOne({ email })
  return person?._id ?? null
}

/**
 * Find-or-create a person from an external roster sync (no WorkOS
 * account yet) — used by OneRoster. Keyed on email since there's no
 * stable external id at this point.
 */
export async function findOrCreatePersonByEmail(params: {
  email: string
  givenName?: string
  familyName?: string
}): Promise<{ id: string; created: boolean }> {
  const personsCol = await persons()
  const now = new Date()

  const before = await personsCol.findOne({ email: params.email })

  const person = await personsCol.findOneAndUpdate(
    { email: params.email },
    {
      $setOnInsert: {
        _id: randomUUID(),
        _schemaVersion: 'v3.1',
        email: params.email,
        emailVerified: false,
        phoneNumberVerified: false,
        givenName: params.givenName ?? null,
        familyName: params.familyName ?? null,
        name: [params.givenName, params.familyName].filter(Boolean).join(' ') || null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true, returnDocument: 'after' }
  )
  if (!person) throw new Error('Failed to find or create person')

  const profilesCol = await lingoProfiles()
  await profilesCol.updateOne(
    { person_id: person._id },
    { $setOnInsert: { person_id: person._id, role: 'user', status: 'active', created_at: now } },
    { upsert: true }
  )

  return { id: person._id, created: !before }
}

/**
 * List merged profiles, filtered by Lingo-local fields (role/status).
 * Used by admin user-management screens.
 */
export async function listMergedProfiles(filter: {
  role?: string
  status?: string
} = {}): Promise<MergedProfile[]> {
  const [personsCol, profilesCol] = await Promise.all([persons(), lingoProfiles()])

  const profileFilter: Record<string, any> = { deleted_at: null }
  if (filter.role) profileFilter.role = filter.role
  if (filter.status) profileFilter.status = filter.status

  const profiles = await profilesCol.find(profileFilter).sort({ created_at: -1 }).toArray()
  if (profiles.length === 0) return []

  const personDocs = await personsCol
    .find({ _id: { $in: profiles.map((p) => p.person_id) } })
    .toArray()
  const personById = new Map(personDocs.map((p) => [p._id, p]))

  return profiles
    .map((profile) => {
      const person = personById.get(profile.person_id)
      return person ? merge(person, profile) : null
    })
    .filter((p): p is MergedProfile => p !== null)
}
