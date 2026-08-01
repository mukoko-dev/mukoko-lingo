/**
 * Tests for the platform.apiKeys <-> ApiKeySummary shape mapping.
 */

import {
  toApiKeySummary,
  toApiKeySummaries,
  buildApiKeyDoc,
  generateApiKey,
  hashApiKey,
} from '../api-key-shape'
import { LINGO_SURFACE_CONTEXT, type PlatformApiKey } from '../types'

beforeAll(() => {
  process.env.API_KEY_HASH_SECRET = 'test-secret-do-not-use-in-prod'
})

function makeKey(overrides: Partial<PlatformApiKey> = {}): PlatformApiKey {
  return {
    _id: 'key-1',
    _schemaVersion: 'v3.1',
    keyType: 'external',
    ownerEntityId: 'entity-1',
    ownerPersonId: null,
    createdByPersonId: 'person-1',
    name: 'Production App',
    keyPrefix: 'mk_live_abcd...',
    keyHashedSecret: 'hashed',
    scopes: ['read'],
    surfaceContext: LINGO_SURFACE_CONTEXT,
    isActive: true,
    billingReferenceId: null,
    planTier: null,
    expiresAt: null,
    lastUsedAt: null,
    monthlyRequestCount: 0,
    monthlyRequestLimit: null,
    revokedAt: null,
    revokedReason: null,
    rotationSchedule: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('generateApiKey / hashApiKey', () => {
  it('generates a prefixed key and a stable scrypt hash of it', () => {
    const key = generateApiKey()
    expect(key.startsWith('mk_live_')).toBe(true)
    expect(key.length).toBeGreaterThan('mk_live_'.length)

    const hash1 = hashApiKey(key)
    const hash2 = hashApiKey(key)
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // sha256 hex digest
  })

  it('generates distinct keys on each call', () => {
    expect(generateApiKey()).not.toBe(generateApiKey())
  })
})

describe('toApiKeySummary', () => {
  it('maps platform.apiKeys fields to the flat snake_case API shape', () => {
    const summary = toApiKeySummary(makeKey())

    expect(summary).toEqual({
      id: 'key-1',
      name: 'Production App',
      organization_id: 'entity-1',
      key_prefix: 'mk_live_abcd...',
      scopes: ['read'],
      last_used_at: null,
      created_at: '2026-01-01T00:00:00.000Z',
      expires_at: null,
      is_active: true,
    })
  })

  it('formats lastUsedAt and expiresAt as ISO strings when present', () => {
    const summary = toApiKeySummary(
      makeKey({
        lastUsedAt: new Date('2026-02-01T00:00:00Z'),
        expiresAt: new Date('2026-03-01T00:00:00Z'),
      })
    )

    expect(summary.last_used_at).toBe('2026-02-01T00:00:00.000Z')
    expect(summary.expires_at).toBe('2026-03-01T00:00:00.000Z')
  })

  it('defaults scopes to an empty array when absent', () => {
    const summary = toApiKeySummary(makeKey({ scopes: undefined as any }))
    expect(summary.scopes).toEqual([])
  })
})

describe('toApiKeySummaries', () => {
  it('maps a list of documents', () => {
    const docs = [makeKey({ _id: 'a' }), makeKey({ _id: 'b' })]
    const result = toApiKeySummaries(docs)

    expect(result).toHaveLength(2)
    expect(result.map((k) => k.id)).toEqual(['a', 'b'])
  })
})

describe('buildApiKeyDoc', () => {
  it('builds a schema-compliant document with keyType external and the lingo surfaceContext', () => {
    const { doc, plainKey } = buildApiKeyDoc({
      name: 'My Key',
      ownerEntityId: 'entity-9',
      createdByPersonId: 'person-9',
    })

    expect(doc._schemaVersion).toBe('v3.1')
    expect(doc.keyType).toBe('external')
    expect(doc.ownerEntityId).toBe('entity-9')
    expect(doc.createdByPersonId).toBe('person-9')
    expect(doc.surfaceContext).toBe(LINGO_SURFACE_CONTEXT)
    expect(doc.isActive).toBe(true)
    expect(doc.scopes).toEqual(['read'])
    expect(doc.expiresAt).toBeNull()
    expect(typeof doc._id).toBe('string')
    expect(doc._id.length).toBeGreaterThan(0)

    // The hashed secret stored on the doc must match a hash of the
    // plaintext key returned once to the caller — never the plaintext itself.
    expect(doc.keyHashedSecret).toBe(hashApiKey(plainKey))
    expect(doc.keyPrefix).toBe(plainKey.substring(0, 12) + '...')
  })

  it('defaults scopes to ["read"] when none are supplied', () => {
    const { doc } = buildApiKeyDoc({ name: 'K', ownerEntityId: 'e', createdByPersonId: 'p' })
    expect(doc.scopes).toEqual(['read'])
  })

  it('uses caller-supplied scopes when provided', () => {
    const { doc } = buildApiKeyDoc({
      name: 'K',
      ownerEntityId: 'e',
      createdByPersonId: 'p',
      scopes: ['read', 'write'],
    })
    expect(doc.scopes).toEqual(['read', 'write'])
  })

  it('falls back to ["read"] when an empty scopes array is supplied', () => {
    const { doc } = buildApiKeyDoc({ name: 'K', ownerEntityId: 'e', createdByPersonId: 'p', scopes: [] })
    expect(doc.scopes).toEqual(['read'])
  })

  it('computes expiresAt from expiresInDays when supplied', () => {
    const before = Date.now()
    const { doc } = buildApiKeyDoc({
      name: 'K',
      ownerEntityId: 'e',
      createdByPersonId: 'p',
      expiresInDays: 30,
    })
    const after = Date.now()

    expect(doc.expiresAt).not.toBeNull()
    const expiresAtMs = doc.expiresAt!.getTime()
    const expectedMin = before + 30 * 24 * 60 * 60 * 1000
    const expectedMax = after + 30 * 24 * 60 * 60 * 1000
    expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin)
    expect(expiresAtMs).toBeLessThanOrEqual(expectedMax)
  })

  it('leaves expiresAt null when expiresInDays is omitted', () => {
    const { doc } = buildApiKeyDoc({ name: 'K', ownerEntityId: 'e', createdByPersonId: 'p' })
    expect(doc.expiresAt).toBeNull()
  })
})
