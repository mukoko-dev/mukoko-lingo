/**
 * Tests for the lingo.learningStandards ↔ API shape mapping.
 *
 * The fixture below is a real document from the live cluster (trimmed),
 * so the mapper is checked against the actual v3.1 schema rather than an
 * assumed one.
 */

import { toApiStandard, toStandardUpdate } from '../standard-shape'
import type { LearningStandard } from '../types'

const LIVE_DOC: LearningStandard = {
  _id: '01977100-0f21-7000-8000-000000000001',
  _schemaVersion: 'v3.1',
  level: 'beginner',
  levelOrder: 1,
  title: 'Beginner - Basic Communication',
  description: 'Start with essential greetings, introductions, and basic everyday phrases.',
  criteria: {
    vocabularySize: 100,
    sentenceComplexity: 'Simple present tense only',
    conversationLength: '1-2 exchanges',
    comprehensionLevel: 'Understand basic questions and statements',
    pronunciationFocus: 'Basic sounds and tones',
  },
  vocabularyRange: '50-150 words',
  conversationTypes: ['Greetings', 'Introductions'],
  grammarConcepts: ['Present tense', 'Personal pronouns'],
  aiPromptTemplate: 'You are teaching a complete beginner.',
  examplePhrases: ['Hello, how are you?', 'Thank you'],
  cefrMapping: 'A1',
  isActive: true,
  createdAt: new Date('2025-11-11T16:30:08.387Z'),
  updatedAt: new Date('2026-06-06T00:00:00Z'),
}

describe('toApiStandard', () => {
  it('exposes the UUID _id as `id`, not an ObjectId string', () => {
    expect(toApiStandard(LIVE_DOC).id).toBe('01977100-0f21-7000-8000-000000000001')
  })

  it('maps camelCase document fields onto the snake_case API contract', () => {
    const api = toApiStandard(LIVE_DOC)

    expect(api.level_order).toBe(1)
    expect(api.vocabulary_range).toBe('50-150 words')
    expect(api.ai_prompt_template).toBe('You are teaching a complete beginner.')
    expect(api.conversation_types).toEqual(['Greetings', 'Introductions'])
    expect(api.grammar_concepts).toEqual(['Present tense', 'Personal pronouns'])
    expect(api.example_phrases).toEqual(['Hello, how are you?', 'Thank you'])
    expect(api.cefr_mapping).toBe('A1')
    expect(api.is_active).toBe(true)
  })

  it('passes `criteria` through as the structured object it really is', () => {
    expect(toApiStandard(LIVE_DOC).criteria).toEqual(LIVE_DOC.criteria)
  })

  it('defaults absent array fields to [] and absent scalars to null', () => {
    const sparse = { ...LIVE_DOC }
    delete sparse.conversationTypes
    delete sparse.vocabularyRange
    delete sparse.criteria

    const api = toApiStandard(sparse)
    expect(api.conversation_types).toEqual([])
    expect(api.vocabulary_range).toBeNull()
    expect(api.criteria).toBeNull()
  })
})

describe('toStandardUpdate', () => {
  it('translates snake_case PUT fields to their camelCase document names', () => {
    expect(
      toStandardUpdate({ vocabulary_range: '60-200 words', ai_prompt_template: 'x', is_active: false })
    ).toEqual({ vocabularyRange: '60-200 words', aiPromptTemplate: 'x', isActive: false })
  })

  it('drops unknown fields rather than writing shadow copies onto the document', () => {
    expect(toStandardUpdate({ title: 'New', level_order: 9, _id: 'evil', isActive: true })).toEqual({
      title: 'New',
    })
  })

  it('omits fields that were not supplied', () => {
    expect(toStandardUpdate({ title: 'Only title' })).toEqual({ title: 'Only title' })
  })

  it('returns an empty object for an empty body', () => {
    expect(toStandardUpdate({})).toEqual({})
  })
})
