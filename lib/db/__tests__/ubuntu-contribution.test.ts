/**
 * Tests for the XpEvent -> ubuntu.contributions mapping (Phase 5).
 */

import {
  xpAmountToWeight,
  resolveContributorEntityId,
  buildUbuntuContribution,
} from '../ubuntu-contribution'
import { MUKOKO_LINGO_ENTITY_ID } from '../types'

describe('xpAmountToWeight', () => {
  it('divides typical small XP amounts by 10', () => {
    expect(xpAmountToWeight(5)).toBeCloseTo(0.5)
    expect(xpAmountToWeight(20)).toBeCloseTo(2.0)
    expect(xpAmountToWeight(50)).toBeCloseTo(5.0)
  })

  it('clamps to the schema minimum (0.1) for tiny or zero amounts', () => {
    expect(xpAmountToWeight(0)).toBe(0.1)
    expect(xpAmountToWeight(0.5)).toBe(0.1)
    expect(xpAmountToWeight(-10)).toBe(0.1)
  })

  it('clamps to the schema maximum (10.0) for large amounts', () => {
    expect(xpAmountToWeight(1000)).toBe(10.0)
    expect(xpAmountToWeight(101)).toBe(10.0)
  })

  it('falls back to the minimum weight for non-finite input', () => {
    expect(xpAmountToWeight(NaN)).toBe(0.1)
    expect(xpAmountToWeight(Infinity)).toBe(0.1)
  })
})

describe('resolveContributorEntityId', () => {
  it('uses the linked family entity when present', () => {
    const person = { bundu: { defaultFamilyEntityId: 'family-123' } } as any
    expect(resolveContributorEntityId(person)).toBe('family-123')
  })

  it('falls back to MUKOKO_LINGO_ENTITY_ID when no bundu entity is linked', () => {
    expect(resolveContributorEntityId({ bundu: undefined } as any)).toBe(MUKOKO_LINGO_ENTITY_ID)
    expect(resolveContributorEntityId({} as any)).toBe(MUKOKO_LINGO_ENTITY_ID)
    expect(resolveContributorEntityId(null)).toBe(MUKOKO_LINGO_ENTITY_ID)
    expect(resolveContributorEntityId(undefined)).toBe(MUKOKO_LINGO_ENTITY_ID)
  })
})

describe('buildUbuntuContribution', () => {
  it('builds a schema-compliant document from an XP event', () => {
    const createdAt = new Date('2026-03-01T00:00:00Z')
    const doc = buildUbuntuContribution({
      contributorPersonId: 'person-1',
      contributorEntityId: MUKOKO_LINGO_ENTITY_ID,
      xpEventId: 'event-1',
      xpEvent: { source: 'quiz_completed', amount: 30, created_at: createdAt },
    })

    expect(doc._schemaVersion).toBe('v3.1')
    expect(doc.contributorPersonId).toBe('person-1')
    expect(doc.contributorEntityId).toBe(MUKOKO_LINGO_ENTITY_ID)
    expect(doc.contributionType).toBe('quiz_completed')
    expect(doc.sourceDomain).toBe('lingo')
    expect(doc.sourceRecordId).toBe('event-1')
    expect(doc.category).toBe('cultural')
    expect(doc.weight).toBeCloseTo(3.0)
    expect(doc.occurredAt).toBe(createdAt)
    expect(typeof doc._id).toBe('string')
    expect(doc._id.length).toBeGreaterThan(0)
  })

  it('defaults contributionType to "xp_event" when the source is missing', () => {
    const doc = buildUbuntuContribution({
      contributorPersonId: 'person-1',
      contributorEntityId: MUKOKO_LINGO_ENTITY_ID,
      xpEventId: 'event-2',
      xpEvent: { source: '', amount: 10, created_at: new Date() },
    })

    expect(doc.contributionType).toBe('xp_event')
  })

  it('falls back to now() for occurredAt when created_at is missing', () => {
    const doc = buildUbuntuContribution({
      contributorPersonId: 'person-1',
      contributorEntityId: MUKOKO_LINGO_ENTITY_ID,
      xpEventId: 'event-3',
      xpEvent: { source: 'phrase_learned', amount: 5, created_at: undefined as any },
    })

    expect(doc.occurredAt).toBeInstanceOf(Date)
  })
})
