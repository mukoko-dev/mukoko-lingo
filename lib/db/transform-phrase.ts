/**
 * Phrase Transformation Helper
 *
 * Converts normalized phrase + translation rows from the lingo schema
 * into the flat shape the frontend expects.
 *
 * DB shape: lingo.phrase + lingo.translation (1 row per language per phrase)
 * App shape: { id, category, english, shona, ndebele, chinese, english_pronunciation, ... }
 */

/** Language code → flat field name mapping */
const LANG_MAP: Record<string, string> = {
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

/** A single translation row from lingo.translation */
export interface TranslationRow {
  language_id: string
  text: string
  pronunciation: string | null
  context: string | null
}

/** A phrase row from lingo.phrase with nested translations */
export interface PhraseWithTranslations {
  id: string
  category: string
  difficulty: string
  skill_id: string | null
  required_proficiency: string | null
  created_at: string
  translations: TranslationRow[]
}

/** The flat phrase shape the frontend expects */
export interface FlatPhrase {
  id: string
  category: string
  difficulty: string
  skillId: string | null
  requiredProficiency: string | null
  createdAt: string
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

/**
 * Flatten a normalized phrase + translations into the flat shape the API returns.
 */
export function flattenPhrase(phrase: PhraseWithTranslations): FlatPhrase {
  const flat: any = {
    id: phrase.id,
    category: phrase.category,
    difficulty: phrase.difficulty,
    skillId: phrase.skill_id,
    requiredProficiency: phrase.required_proficiency,
    createdAt: phrase.created_at,
    english: '',
    shona: '',
    ndebele: '',
    chinese: '',
    englishPronunciation: null,
    shonaPronunciation: null,
    ndebelePronunciation: null,
    chinesePronunciation: null,
    englishContext: null,
    shonaContext: null,
    ndebeleContext: null,
    chineseContext: null,
  }

  for (const t of phrase.translations || []) {
    const name = LANG_MAP[t.language_id]
    if (!name) continue
    flat[name] = t.text
    flat[`${name}Pronunciation`] = t.pronunciation
    flat[`${name}Context`] = t.context
  }

  return flat as FlatPhrase
}

/**
 * Flatten an array of normalized phrases.
 */
export function flattenPhrases(phrases: PhraseWithTranslations[]): FlatPhrase[] {
  return phrases.map(flattenPhrase)
}

/**
 * Build translation rows from flat phrase input (for inserts/updates).
 * Used by admin phrase creation/update endpoints.
 */
export function buildTranslationRows(
  phraseId: string,
  body: Record<string, any>
): Array<{ phrase_id: string; language_id: string; text: string; pronunciation: string | null; context: string | null }> {
  const rows: Array<{ phrase_id: string; language_id: string; text: string; pronunciation: string | null; context: string | null }> = []

  for (const [name, code] of Object.entries(LANG_CODE_MAP)) {
    const text = body[name]
    if (text === undefined) continue
    rows.push({
      phrase_id: phraseId,
      language_id: code,
      text,
      pronunciation: body[`${name}_pronunciation`] ?? null,
      context: body[`${name}_context`] ?? null,
    })
  }

  return rows
}
