/**
 * Maps the real `lingo.learningStandards` document shape (camelCase v3.1)
 * to and from the API's snake_case shape — the contract the admin standards
 * screen already consumes, unchanged since the old Postgres table.
 *
 * Same role as `phrase-shape.ts` plays for `lingo.phrases`.
 */

import type { LearningStandard, LearningStandardCriteria } from './types'

export interface ApiLearningStandard {
  id: string
  level: string
  level_order: number
  title: string
  description: string
  criteria: LearningStandardCriteria | null
  vocabulary_range: string | null
  conversation_types: string[]
  grammar_concepts: string[]
  ai_prompt_template: string | null
  example_phrases: string[]
  cefr_mapping: string | null
  is_active: boolean
}

export function toApiStandard(doc: LearningStandard): ApiLearningStandard {
  return {
    id: doc._id,
    level: doc.level,
    level_order: doc.levelOrder,
    title: doc.title,
    description: doc.description,
    criteria: doc.criteria ?? null,
    vocabulary_range: doc.vocabularyRange ?? null,
    conversation_types: doc.conversationTypes ?? [],
    grammar_concepts: doc.grammarConcepts ?? [],
    ai_prompt_template: doc.aiPromptTemplate ?? null,
    example_phrases: doc.examplePhrases ?? [],
    cefr_mapping: doc.cefrMapping ?? null,
    is_active: doc.isActive,
  }
}

/** snake_case API field → camelCase document field, for PUT bodies. */
const UPDATABLE_FIELDS: Record<string, keyof LearningStandard> = {
  title: 'title',
  description: 'description',
  criteria: 'criteria',
  vocabulary_range: 'vocabularyRange',
  conversation_types: 'conversationTypes',
  grammar_concepts: 'grammarConcepts',
  ai_prompt_template: 'aiPromptTemplate',
  example_phrases: 'examplePhrases',
  is_active: 'isActive',
}

/**
 * Translate a snake_case PUT body into a camelCase `$set` document. Only
 * known fields pass through — writing the snake_case names straight onto a
 * v3.1 document would silently create a shadow copy of every field that
 * nothing else in the ecosystem reads.
 */
export function toStandardUpdate(body: Record<string, any>): Partial<LearningStandard> {
  const update: Record<string, any> = {}

  for (const [apiField, docField] of Object.entries(UPDATABLE_FIELDS)) {
    if (body[apiField] !== undefined) update[docField] = body[apiField]
  }

  return update as Partial<LearningStandard>
}
