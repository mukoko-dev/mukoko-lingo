/**
 * Maps a flat Mongo `phrases` document to the API's flat camelCase phrase
 * shape (unchanged contract from the old Postgres phrase+translation join —
 * see git history for the previous `lib/db/transform-phrase.ts`).
 */

import type { Phrase } from './types'

/** Language code → flat field name mapping */
export const LANG_MAP: Record<string, string> = {
  en: 'english',
  sn: 'shona',
  nd: 'ndebele',
  zh: 'chinese',
}

/** Reverse: flat field name → language code */
export const LANG_CODE_MAP: Record<string, string> = {
  english: 'en',
  shona: 'sn',
  ndebele: 'nd',
  chinese: 'zh',
}

export interface ApiPhrase {
  id: string
  category: string
  difficulty: string | null
  skillId: string | null
  requiredProficiency: string | null
  createdAt: string | null
  english: string
  shona: string
  ndebele: string
  chinese: string
  englishPronunciation: string | null
  shonaPronunciation: string | null
  ndebelePronunciation: string | null
  chinesePronunciation: string | null
  englishContext: string | null
  shonaContext: string | null
  ndebeleContext: string | null
  chineseContext: string | null
}

export function toApiPhrase(doc: Phrase & { _id: any }): ApiPhrase {
  return {
    id: String(doc._id),
    category: doc.category,
    difficulty: doc.difficulty ?? null,
    skillId: doc.skill_id ?? null,
    requiredProficiency: doc.required_proficiency ?? null,
    createdAt: doc.created_at ? new Date(doc.created_at).toISOString() : null,
    english: doc.english,
    shona: doc.shona,
    ndebele: doc.ndebele,
    chinese: doc.chinese,
    englishPronunciation: doc.pronunciation?.english ?? null,
    shonaPronunciation: doc.pronunciation?.shona ?? null,
    ndebelePronunciation: doc.pronunciation?.ndebele ?? null,
    chinesePronunciation: doc.pronunciation?.chinese ?? null,
    englishContext: doc.context?.en ?? null,
    shonaContext: doc.context?.sn ?? null,
    ndebeleContext: doc.context?.nd ?? null,
    chineseContext: doc.context?.zh ?? null,
  }
}

export function toApiPhrases(docs: Array<Phrase & { _id: any }>): ApiPhrase[] {
  return docs.map(toApiPhrase)
}

/** Build a Mongo phrase doc's language fields from flat API input (admin create/update). */
export function buildPhraseLanguageFields(body: Record<string, any>) {
  return {
    english: body.english ?? '',
    shona: body.shona ?? '',
    ndebele: body.ndebele ?? '',
    swahili: body.swahili ?? '',
    chinese: body.chinese ?? '',
    pronunciation: {
      english: body.englishPronunciation ?? '',
      shona: body.shonaPronunciation ?? '',
      ndebele: body.ndebelePronunciation ?? '',
      swahili: body.swahiliPronunciation ?? '',
      chinese: body.chinesePronunciation ?? '',
    },
    context: {
      en: body.englishContext ?? '',
      sn: body.shonaContext ?? '',
      nd: body.ndebeleContext ?? '',
      sw: body.swahiliContext ?? '',
      zh: body.chineseContext ?? '',
    },
  }
}
