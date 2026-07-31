/**
 * Tests for the lingo.phrases <-> ApiPhrase shape mapping.
 */

import { toApiPhrase, toApiPhrases, buildPhraseDoc, mergeTranslations } from '../phrase-shape'
import { MUKOKO_LINGO_ENTITY_ID, type Phrase } from '../types'

function makePhrase(overrides: Partial<Phrase> = {}): Phrase {
  return {
    _id: 'phrase-1',
    _schemaVersion: 'v3.1',
    category: 'greetings',
    contentType: 'phrase',
    difficulty: 'beginner',
    creatorEntityId: MUKOKO_LINGO_ENTITY_ID,
    isActive: true,
    viewCount: 0,
    bookmarkCount: 0,
    translations: [
      { languageTag: 'en', text: 'Hello', pronunciation: 'heh-LOH', context: 'Standard greeting' },
      { languageTag: 'sn', text: 'Mhoro', pronunciation: 'mm-HO-ro', context: 'Kwaziso yakajairwa' },
      { languageTag: 'nd', text: 'Sawubona', pronunciation: 'sah-woo-BOH-nah', context: 'Ukubingelela' },
      { languageTag: 'zh', text: '你好', pronunciation: 'nǐ hǎo', context: '标准问候' },
    ],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  }
}

describe('toApiPhrase', () => {
  it('maps translations[] to flat per-language fields', () => {
    const api = toApiPhrase(makePhrase())

    expect(api.id).toBe('phrase-1')
    expect(api.category).toBe('greetings')
    expect(api.english).toBe('Hello')
    expect(api.shona).toBe('Mhoro')
    expect(api.ndebele).toBe('Sawubona')
    expect(api.chinese).toBe('你好')
    expect(api.englishPronunciation).toBe('heh-LOH')
    expect(api.shonaContext).toBe('Kwaziso yakajairwa')
    expect(api.createdAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('falls back to empty strings and nulls when a language is missing', () => {
    const api = toApiPhrase(makePhrase({ translations: [{ languageTag: 'en', text: 'Hello' }] }))

    expect(api.english).toBe('Hello')
    expect(api.shona).toBe('')
    expect(api.ndebele).toBe('')
    expect(api.chinese).toBe('')
    expect(api.englishPronunciation).toBeNull()
    expect(api.shonaContext).toBeNull()
  })

  it('defaults optional fields (cefrLevel, scenarioIds, tags) when absent', () => {
    const api = toApiPhrase(makePhrase({ cefrLevel: undefined, scenarioIds: undefined, tags: undefined }))

    expect(api.cefrLevel).toBeNull()
    expect(api.scenarioIds).toEqual([])
    expect(api.tags).toEqual([])
  })

  it('passes through cefrLevel, scenarioIds and tags when present', () => {
    const api = toApiPhrase(makePhrase({ cefrLevel: 'A1', scenarioIds: ['scn-1'], tags: ['greetings'] }))

    expect(api.cefrLevel).toBe('A1')
    expect(api.scenarioIds).toEqual(['scn-1'])
    expect(api.tags).toEqual(['greetings'])
  })
})

describe('toApiPhrases', () => {
  it('maps a list of documents', () => {
    const docs = [makePhrase({ _id: 'a' }), makePhrase({ _id: 'b' })]
    const result = toApiPhrases(docs)

    expect(result).toHaveLength(2)
    expect(result.map((p) => p.id)).toEqual(['a', 'b'])
  })
})

describe('buildPhraseDoc', () => {
  it('builds a schema-compliant document from flat admin input', () => {
    const doc = buildPhraseDoc({
      category: 'food',
      difficulty: 'elementary',
      english: 'Water',
      englishPronunciation: 'WAW-ter',
      shona: 'Mvura',
    })

    expect(doc._schemaVersion).toBe('v3.1')
    expect(doc.creatorEntityId).toBe(MUKOKO_LINGO_ENTITY_ID)
    expect(doc.contentType).toBe('phrase')
    expect(doc.category).toBe('food')
    expect(doc.difficulty).toBe('elementary')
    expect(doc.isActive).toBe(true)
    expect(doc.viewCount).toBe(0)
    expect(doc.bookmarkCount).toBe(0)
    expect(doc.translations).toEqual([
      { languageTag: 'en', text: 'Water', pronunciation: 'WAW-ter', context: null },
      { languageTag: 'sn', text: 'Mvura', pronunciation: null, context: null },
    ])
    expect(typeof doc._id).toBe('string')
    expect(doc._id.length).toBeGreaterThan(0)
  })

  it('defaults category, contentType and difficulty when omitted', () => {
    const doc = buildPhraseDoc({ english: 'Hi' })

    expect(doc.category).toBe('general')
    expect(doc.contentType).toBe('phrase')
    expect(doc.difficulty).toBe('beginner')
  })

  it('defaults tags to the category when tags are not supplied', () => {
    const doc = buildPhraseDoc({ category: 'business', english: 'Hi' })
    expect(doc.tags).toEqual(['business'])
  })

  it('omits a language entirely when no text is supplied for it', () => {
    const doc = buildPhraseDoc({ english: 'Hi' })
    expect(doc.translations).toEqual([{ languageTag: 'en', text: 'Hi', pronunciation: null, context: null }])
  })
})

describe('mergeTranslations', () => {
  const existing = [
    { languageTag: 'en', text: 'Hello', pronunciation: 'heh-LOH', context: 'greeting' },
    { languageTag: 'sn', text: 'Mhoro', pronunciation: 'mm-HO-ro', context: null },
  ]

  it('updates only the fields supplied for an existing language', () => {
    const merged = mergeTranslations(existing, { english: 'Hi' })
    const en = merged.find((t) => t.languageTag === 'en')

    expect(en?.text).toBe('Hi')
    expect(en?.pronunciation).toBe('heh-LOH')
    expect(en?.context).toBe('greeting')
  })

  it('leaves untouched languages exactly as they were', () => {
    const merged = mergeTranslations(existing, { english: 'Hi' })
    const sn = merged.find((t) => t.languageTag === 'sn')

    expect(sn).toEqual(existing[1])
  })

  it('adds a new language entry if it did not exist before', () => {
    const merged = mergeTranslations(existing, { ndebele: 'Sawubona' })
    const nd = merged.find((t) => t.languageTag === 'nd')

    expect(nd).toEqual({ languageTag: 'nd', text: 'Sawubona' })
  })

  it('returns the existing array unchanged when no relevant fields are supplied', () => {
    const merged = mergeTranslations(existing, { category: 'greetings' })
    expect(merged).toEqual(existing)
  })
})
