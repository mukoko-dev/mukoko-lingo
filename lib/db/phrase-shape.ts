/**
 * Maps the real `lingo.phrases` document shape (`translations[]`, keyed by
 * BCP-47 tag) to and from the API's flat camelCase phrase shape — the
 * contract mobile/web clients already consume (`phrasesApi`), unchanged
 * since the old Postgres phrase+translation join.
 */

import { randomUUID } from 'crypto'
import type { Phrase, PhraseTranslation } from './types'
import { MUKOKO_LINGO_ENTITY_ID } from './types'

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
  cefrLevel: string | null
  scenarioIds: string[]
  tags: string[]
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

function translationFor(doc: Phrase, code: string): PhraseTranslation | undefined {
  return doc.translations?.find((t) => t.languageTag === code)
}

export function toApiPhrase(doc: Phrase): ApiPhrase {
  const en = translationFor(doc, 'en')
  const sn = translationFor(doc, 'sn')
  const nd = translationFor(doc, 'nd')
  const zh = translationFor(doc, 'zh')

  return {
    id: doc._id,
    category: doc.category,
    difficulty: doc.difficulty ?? null,
    cefrLevel: doc.cefrLevel ?? null,
    scenarioIds: doc.scenarioIds ?? [],
    tags: doc.tags ?? [],
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    english: en?.text ?? '',
    shona: sn?.text ?? '',
    ndebele: nd?.text ?? '',
    chinese: zh?.text ?? '',
    englishPronunciation: en?.pronunciation ?? null,
    shonaPronunciation: sn?.pronunciation ?? null,
    ndebelePronunciation: nd?.pronunciation ?? null,
    chinesePronunciation: zh?.pronunciation ?? null,
    englishContext: en?.context ?? null,
    shonaContext: sn?.context ?? null,
    ndebeleContext: nd?.context ?? null,
    chineseContext: zh?.context ?? null,
  }
}

export function toApiPhrases(docs: Phrase[]): ApiPhrase[] {
  return docs.map(toApiPhrase)
}

/**
 * Build a full, schema-compliant lingo.phrases document from flat admin
 * input (create). `_id` is a UUID string, `creatorEntityId` is always the
 * real Mukoko Lingo product entity — Lingo only ever authors as itself.
 */
export function buildPhraseDoc(body: Record<string, any>): Phrase {
  const now = new Date()
  const translations: PhraseTranslation[] = []

  const push = (code: string, textKey: string, pronKey: string, ctxKey: string) => {
    if (body[textKey]) {
      translations.push({
        languageTag: code,
        text: body[textKey],
        pronunciation: body[pronKey] ?? null,
        context: body[ctxKey] ?? null,
      })
    }
  }

  push('en', 'english', 'englishPronunciation', 'englishContext')
  push('sn', 'shona', 'shonaPronunciation', 'shonaContext')
  push('nd', 'ndebele', 'ndebelePronunciation', 'ndebeleContext')
  push('zh', 'chinese', 'chinesePronunciation', 'chineseContext')

  return {
    _id: randomUUID(),
    _schemaVersion: 'v3.1',
    category: body.category || 'general',
    contentType: body.contentType || body.content_type || 'phrase',
    difficulty: body.difficulty || 'beginner',
    cefrLevel: body.cefrLevel ?? null,
    creatorEntityId: MUKOKO_LINGO_ENTITY_ID,
    scenarioIds: body.scenarioIds ?? [],
    tags: body.tags ?? (body.category ? [body.category] : []),
    isActive: true,
    viewCount: 0,
    bookmarkCount: 0,
    translations,
    createdAt: now,
    updatedAt: now,
    mukoko: { sourceProject: 'lingo' },
  }
}

/**
 * Merge flat per-language edits from admin input into an existing
 * translations[] array (translations[] must be replaced wholesale — Mongo
 * can't address one array element by languageTag in a $set).
 */
export function mergeTranslations(existing: PhraseTranslation[], body: Record<string, any>): PhraseTranslation[] {
  const langs: [string, string, string, string][] = [
    ['en', 'english', 'englishPronunciation', 'englishContext'],
    ['sn', 'shona', 'shonaPronunciation', 'shonaContext'],
    ['nd', 'ndebele', 'ndebelePronunciation', 'ndebeleContext'],
    ['zh', 'chinese', 'chinesePronunciation', 'chineseContext'],
  ]

  const byCode = new Map(existing.map((t) => [t.languageTag, { ...t }]))

  for (const [code, textKey, pronKey, ctxKey] of langs) {
    if (body[textKey] === undefined && body[pronKey] === undefined && body[ctxKey] === undefined) continue
    const current = byCode.get(code) ?? { languageTag: code, text: '' }
    if (body[textKey] !== undefined) current.text = body[textKey]
    if (body[pronKey] !== undefined) current.pronunciation = body[pronKey]
    if (body[ctxKey] !== undefined) current.context = body[ctxKey]
    byCode.set(code, current)
  }

  return Array.from(byCode.values())
}
