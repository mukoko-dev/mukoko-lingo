/**
 * The merge layer between the shared `identity.persons` record and Lingo's
 * own `learner_profiles`.
 *
 * Every authenticated request passes through here, and the failure mode is
 * not a crash: it is one learner's profile merged onto another learner's
 * identity, or a sign-in quietly creating a second person for someone who
 * already had one. Those are the properties pinned below.
 *
 * The collections are doubled in memory rather than mocked per call, so the
 * assertions are about what these functions *do to the data* — an upsert that
 * matches the wrong document shows up as a wrong document, not as a wrong
 * call signature.
 */

const mockPersonsStore: any[] = []
const mockProfilesStore: any[] = []

/** Enough of the Mongo surface for this module; see the note above. */
function mockCollection(rows: any[]) {
  const match = (doc: any, filter: any): boolean =>
    Object.entries(filter).every(([key, value]) => {
      if (value && typeof value === 'object' && '$in' in (value as any)) {
        return (value as any).$in.includes(doc[key])
      }
      if (value && typeof value === 'object' && '$gte' in (value as any)) {
        return doc[key] >= (value as any).$gte
      }
      if (value === null) return doc[key] === null || doc[key] === undefined
      return doc[key] === value
    })

  const applyUpdate = (doc: any, update: any) => {
    Object.assign(doc, update.$set || {})
    return doc
  }

  return {
    findOne: async (filter: any) => rows.find((d) => match(d, filter)) ?? null,
    countDocuments: async (filter: any) => rows.filter((d) => match(d, filter)).length,
    find: (filter: any) => {
      let found = rows.filter((d) => match(d, filter))
      const cursor: any = {
        sort: (spec: any) => {
          const [key, dir] = Object.entries(spec)[0] as [string, number]
          found = [...found].sort((a, b) => (a[key] > b[key] ? dir : a[key] < b[key] ? -dir : 0))
          return cursor
        },
        limit: (n: number) => {
          found = found.slice(0, n)
          return cursor
        },
        toArray: async () => found,
      }
      return cursor
    },
    findOneAndUpdate: async (filter: any, update: any, options: any = {}) => {
      const existing = rows.find((d) => match(d, filter))
      if (existing) return applyUpdate(existing, update)
      if (!options.upsert) return null
      const created = { ...(update.$setOnInsert || {}), ...(update.$set || {}) }
      rows.push(created)
      return created
    },
    updateOne: async (filter: any, update: any, options: any = {}) => {
      const existing = rows.find((d) => match(d, filter))
      if (existing) {
        applyUpdate(existing, update)
        return { matchedCount: 1, upsertedCount: 0 }
      }
      if (!options.upsert) return { matchedCount: 0, upsertedCount: 0 }
      rows.push({ ...(update.$setOnInsert || {}), ...(update.$set || {}) })
      return { matchedCount: 0, upsertedCount: 1 }
    },
  }
}

jest.mock('../collections', () => ({
  __esModule: true,
  persons: async () => mockCollection(mockPersonsStore),
  lingoProfiles: async () => mockCollection(mockProfilesStore),
}))

import { MUKOKO_LINGO_ENTITY_ID } from '../types'
import {
  countLingoProfiles,
  findOrCreatePersonByEmail,
  findOrCreatePersonFromWorkOS,
  findPersonIdByEmail,
  getDisplayNames,
  getMergedProfile,
  getMergedProfileByEmail,
  listMergedProfiles,
  recentMergedProfiles,
  resolveOwnerEntityId,
  touchLastActive,
  updateLingoProfile,
} from '../identity'

function seedPerson(overrides: Record<string, any> = {}) {
  const person = {
    _id: 'person-1',
    workosUserId: 'workos-1',
    email: 'tendai@example.com',
    name: 'Tendai Moyo',
    givenName: 'Tendai',
    familyName: 'Moyo',
    createdAt: new Date('2026-01-01'),
    ...overrides,
  }
  mockPersonsStore.push(person)
  return person
}

function seedProfile(overrides: Record<string, any> = {}) {
  const profile = {
    person_id: 'person-1',
    role: 'user',
    status: 'active',
    created_at: new Date('2026-01-01'),
    deleted_at: null,
    ...overrides,
  }
  mockProfilesStore.push(profile)
  return profile
}

beforeEach(() => {
  mockPersonsStore.length = 0
  mockProfilesStore.length = 0
})

describe('findOrCreatePersonFromWorkOS', () => {
  const workosUser = { id: 'workos-1', email: 'tendai@example.com', firstName: 'Tendai', lastName: 'Moyo' }

  it('creates the person and the Lingo profile together on first sign-in', async () => {
    const merged = await findOrCreatePersonFromWorkOS(workosUser)

    expect(mockPersonsStore).toHaveLength(1)
    expect(mockProfilesStore).toHaveLength(1)
    // A person without a profile would read as role/status undefined
    // downstream; the pair is created in one flow for that reason.
    expect(merged).toMatchObject({ email: 'tendai@example.com', role: 'user', status: 'active' })
    expect(merged.id).toEqual(mockProfilesStore[0].person_id)
  })

  it('keys on the WorkOS id, not the email', async () => {
    // The email on a WorkOS account can change. Keying on it would create a
    // second person for someone who already has one, splitting their history
    // and leaving the tutor reading an empty profile.
    const first = await findOrCreatePersonFromWorkOS(workosUser)
    const second = await findOrCreatePersonFromWorkOS({ ...workosUser, email: 'tendai.moyo@newdomain.com' })

    expect(second.id).toBe(first.id)
    expect(mockPersonsStore).toHaveLength(1)
    expect(mockProfilesStore).toHaveLength(1)
  })

  it('gives a different WorkOS account its own person', async () => {
    await findOrCreatePersonFromWorkOS(workosUser)
    const other = await findOrCreatePersonFromWorkOS({ id: 'workos-2', email: 'sipho@example.com' })

    expect(mockPersonsStore).toHaveLength(2)
    expect(other.id).not.toBe(mockPersonsStore[0]._id)
  })

  it('does not reset an existing profile on a later sign-in', async () => {
    // $setOnInsert, not $set: an admin who signs in again is still an admin.
    seedPerson()
    seedProfile({ role: 'admin', status: 'active' })

    const merged = await findOrCreatePersonFromWorkOS(workosUser)

    expect(merged.role).toBe('admin')
    expect(mockProfilesStore).toHaveLength(1)
  })
})

describe('the merged shape', () => {
  it('falls back through name, given name, then the email local part', async () => {
    seedPerson({ _id: 'p-name', name: 'Tendai Moyo', workosUserId: 'w1' })
    seedPerson({ _id: 'p-given', name: null, givenName: 'Sipho', workosUserId: 'w2' })
    seedPerson({ _id: 'p-email', name: null, givenName: null, email: 'rudo@example.com', workosUserId: 'w3' })
    seedPerson({ _id: 'p-none', name: null, givenName: null, email: null, workosUserId: 'w4' })

    expect((await getMergedProfile('p-name'))?.display_name).toBe('Tendai Moyo')
    expect((await getMergedProfile('p-given'))?.display_name).toBe('Sipho')
    expect((await getMergedProfile('p-email'))?.display_name).toBe('rudo')
    // Never blank: an empty name renders as an empty row in the admin UI.
    expect((await getMergedProfile('p-none'))?.display_name).toBe('Learner')
  })

  it('defaults role and status when a person has no Lingo profile yet', async () => {
    seedPerson()

    const merged = await getMergedProfile('person-1')

    // Defaulting to 'user'/'active' rather than undefined is what keeps a
    // missing profile from being read as an unrestricted account.
    expect(merged).toMatchObject({ role: 'user', status: 'active' })
  })

  it('carries the Lingo-local fields through', async () => {
    seedPerson()
    seedProfile({ role: 'admin', status: 'banned', preferred_ui_language: 'sn', daily_goal: 20 })

    expect(await getMergedProfile('person-1')).toMatchObject({
      role: 'admin',
      status: 'banned',
      preferred_ui_language: 'sn',
      daily_goal: 20,
    })
  })

  it('returns null for a person that does not exist', async () => {
    expect(await getMergedProfile('nobody')).toBeNull()
    expect(await getMergedProfileByEmail('nobody@example.com')).toBeNull()
  })

  it('finds by email as well as by id', async () => {
    seedPerson()
    seedProfile({ role: 'admin' })

    expect((await getMergedProfileByEmail('tendai@example.com'))?.role).toBe('admin')
  })
})

describe('updateLingoProfile', () => {
  it('refuses to write a profile for a person that does not exist', async () => {
    // Otherwise a bad id leaves an orphan learner_profiles row that no
    // identity record will ever claim.
    expect(await updateLingoProfile('nobody', { role: 'admin' })).toBeNull()
    expect(mockProfilesStore).toHaveLength(0)
  })

  it('creates the profile row when the person exists but has none', async () => {
    seedPerson()

    const merged = await updateLingoProfile('person-1', { preferred_ui_language: 'nd' })

    expect(merged?.preferred_ui_language).toBe('nd')
    expect(mockProfilesStore).toHaveLength(1)
  })

  it('patches only the fields it was given', async () => {
    seedPerson()
    seedProfile({ role: 'admin', daily_goal: 15 })

    const merged = await updateLingoProfile('person-1', { daily_goal: 30 })

    expect(merged).toMatchObject({ role: 'admin', daily_goal: 30 })
  })

  it('leaves the shared identity record untouched', async () => {
    // learner_profiles is Lingo's; identity.persons belongs to the ecosystem.
    seedPerson()
    const before = { ...mockPersonsStore[0] }

    await updateLingoProfile('person-1', { role: 'admin', status: 'banned' })

    expect(mockPersonsStore[0]).toEqual(before)
  })
})

describe('touchLastActive', () => {
  it('records activity, creating the profile if the learner has none', async () => {
    await touchLastActive('person-1')

    expect(mockProfilesStore).toHaveLength(1)
    expect(mockProfilesStore[0]).toMatchObject({ person_id: 'person-1', role: 'user', status: 'active' })
    expect(mockProfilesStore[0].last_active).toBeInstanceOf(Date)
  })

  it('does not disturb an existing role', async () => {
    seedProfile({ role: 'admin' })

    await touchLastActive('person-1')

    expect(mockProfilesStore).toHaveLength(1)
    expect(mockProfilesStore[0].role).toBe('admin')
  })
})

describe('listing and counting', () => {
  it('drops a profile whose person is missing rather than merging the wrong one', async () => {
    // The property that matters most here: a learner_profiles row with no
    // identity record must vanish from the list, never inherit a neighbour's
    // name or email.
    seedPerson({ _id: 'person-1', workosUserId: 'w1', email: 'tendai@example.com' })
    seedProfile({ person_id: 'person-1' })
    seedProfile({ person_id: 'orphan', created_at: new Date('2026-02-01') })

    const listed = await listMergedProfiles()

    expect(listed).toHaveLength(1)
    expect(listed[0].id).toBe('person-1')
    expect(listed.some((p) => p.email === null && p.display_name === 'Learner')).toBe(false)
  })

  it('filters by the Lingo-local role and status', async () => {
    seedPerson({ _id: 'a', workosUserId: 'wa', email: 'a@example.com' })
    seedPerson({ _id: 'b', workosUserId: 'wb', email: 'b@example.com' })
    seedProfile({ person_id: 'a', role: 'admin' })
    seedProfile({ person_id: 'b', role: 'user' })

    expect((await listMergedProfiles({ role: 'admin' })).map((p) => p.id)).toEqual(['a'])
    expect(await listMergedProfiles({ status: 'banned' })).toEqual([])
  })

  it('excludes soft-deleted profiles from lists and counts', async () => {
    seedPerson({ _id: 'a', workosUserId: 'wa', email: 'a@example.com' })
    seedPerson({ _id: 'b', workosUserId: 'wb', email: 'b@example.com' })
    seedProfile({ person_id: 'a' })
    seedProfile({ person_id: 'b', deleted_at: new Date() })

    expect((await listMergedProfiles()).map((p) => p.id)).toEqual(['a'])
    expect(await countLingoProfiles()).toBe(1)
    expect(await countLingoProfiles({ role: 'admin' })).toBe(0)
  })

  it('returns the recent profiles, newest first, and nothing when there are none', async () => {
    seedPerson({ _id: 'a', workosUserId: 'wa', email: 'a@example.com' })
    seedPerson({ _id: 'b', workosUserId: 'wb', email: 'b@example.com' })
    seedProfile({ person_id: 'a', created_at: new Date('2026-03-01') })
    seedProfile({ person_id: 'b', created_at: new Date('2026-03-05') })

    const since = new Date('2026-02-01')
    expect((await recentMergedProfiles(since, 10)).map((p) => p.id)).toEqual(['b', 'a'])
    expect(await recentMergedProfiles(since, 1)).toHaveLength(1)
    expect(await recentMergedProfiles(new Date('2026-06-01'), 10)).toEqual([])
  })
})

describe('getDisplayNames', () => {
  it('maps ids to names for the ids it knows', async () => {
    seedPerson({ _id: 'a', name: 'Tendai Moyo', workosUserId: 'wa' })
    seedPerson({ _id: 'b', name: null, givenName: 'Sipho', workosUserId: 'wb' })

    expect(await getDisplayNames(['a', 'b', 'missing'])).toEqual({ a: 'Tendai Moyo', b: 'Sipho' })
  })

  it('short-circuits an empty request without querying', async () => {
    expect(await getDisplayNames([])).toEqual({})
  })
})

describe('resolveOwnerEntityId', () => {
  it("uses the person's family entity when the ecosystem has provisioned one", async () => {
    seedPerson({ bundu: { defaultFamilyEntityId: 'entity-family-1' } })

    expect(await resolveOwnerEntityId('person-1')).toBe('entity-family-1')
  })

  it('falls back to the Lingo product entity, which is the common case today', async () => {
    seedPerson()

    expect(await resolveOwnerEntityId('person-1')).toBe(MUKOKO_LINGO_ENTITY_ID)
    // Also for a person that does not exist: the shared schema requires an
    // owner, so this must never return undefined.
    expect(await resolveOwnerEntityId('nobody')).toBe(MUKOKO_LINGO_ENTITY_ID)
  })
})

describe('roster sync by email', () => {
  it('reports whether it created the person', async () => {
    // OneRoster uses `created` to decide whether to send a welcome; a wrong
    // answer either spams an existing learner or silently onboards nobody.
    const first = await findOrCreatePersonByEmail({ email: 'rudo@example.com', givenName: 'Rudo' })
    expect(first.created).toBe(true)

    const second = await findOrCreatePersonByEmail({ email: 'rudo@example.com' })
    expect(second.created).toBe(false)
    expect(second.id).toBe(first.id)
    expect(mockPersonsStore).toHaveLength(1)
  })

  it('creates the Lingo profile alongside the person', async () => {
    await findOrCreatePersonByEmail({ email: 'rudo@example.com', givenName: 'Rudo', familyName: 'Chikafu' })

    expect(mockProfilesStore).toHaveLength(1)
    expect(mockProfilesStore[0]).toMatchObject({ role: 'user', status: 'active' })
    expect(mockPersonsStore[0]).toMatchObject({ name: 'Rudo Chikafu', emailVerified: false })
  })

  it('resolves an id from an email, or null', async () => {
    seedPerson()

    expect(await findPersonIdByEmail('tendai@example.com')).toBe('person-1')
    expect(await findPersonIdByEmail('nobody@example.com')).toBeNull()
  })
})
