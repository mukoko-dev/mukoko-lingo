/**
 * Server-side construction of the Shamwari system prompt.
 *
 * The chat route used to accept `system_prompt` from the request body, which
 * meant the caller decided what the model was told it was — the tutor framing,
 * the safety guidance, all of it could be replaced wholesale by anyone posting
 * to the endpoint directly. The prompt is now built here from the
 * authenticated user's stored proficiency; the request only gets to pick a
 * conversation type and a language, both from fixed sets.
 */

import { userSkills, skills as skillsCollection } from './mongo'
import { createLogger } from './logger'
import {
  buildTutorPrompt,
  defaultProficiencyMap,
  toProficiencyMap,
  normalizeLanguage,
  normalizeConversationType,
  ALL_SKILL_NAMES,
} from '../../lib/ai/prompt-builder'

const log = createLogger('ai')

/**
 * Read the user's per-skill scores from `lingo.user_skills`.
 *
 * `user_skills` keys on `skill_id` (a UUID into `lingo.skills`), so the skill
 * names the prompt scaffolds against come from that join. Only `linguistic`
 * skills are used — domain skills describe what a learner is working on, not
 * an ability the tutor adjusts its language for.
 */
export async function loadProficiencyScores(personId: string): Promise<Record<string, number>> {
  const scores: Record<string, number> = {}

  const userSkillsCol = await userSkills()
  const rows = await userSkillsCol.find({ user_id: personId }).toArray()
  if (rows.length === 0) return scores

  const skillIds = rows.map((r: any) => r.skill_id).filter(Boolean)
  if (skillIds.length === 0) return scores

  const skillsCol = await skillsCollection()
  const skillDocs = await skillsCol.find({ _id: { $in: skillIds } as any }).toArray()
  const nameById = new Map(skillDocs.map((s: any) => [String(s._id), s.name]))

  for (const row of rows as any[]) {
    const name = nameById.get(String(row.skill_id))
    // Ignore anything that isn't one of the five linguistic skills the prompt
    // knows how to scaffold against.
    if (!name || !ALL_SKILL_NAMES.includes(name)) continue
    if (typeof row.current_score === 'number') scores[name] = row.current_score
  }

  return scores
}

/**
 * Build the system prompt for an authenticated user.
 *
 * `language` and `conversationType` come from the request but are mapped
 * through allowlists, so neither can contribute arbitrary text to the prompt.
 * A database failure degrades to beginner defaults rather than dropping the
 * prompt — a request must never reach the model unframed.
 */
export async function buildSystemPromptForUser(params: {
  personId: string
  language: unknown
  conversationType: unknown
  /**
   * Proficiency the client holds locally. Practice, mini-quizzes and
   * assessments all record scores through `updateUserSkill` into device
   * storage, and nothing syncs them to `lingo.user_skills` — so the server
   * has no copy for most users and would otherwise scaffold every learner as
   * a beginner.
   *
   * These are numbers only, and they are clamped and used solely to pick
   * which fixed guidance string the prompt gets. No client text ever reaches
   * the prompt, which is what the caller-supplied `system_prompt` used to do.
   * Server-held scores win when they exist.
   */
  clientScores?: unknown
}): Promise<string> {
  const language = normalizeLanguage(params.language)
  const conversationType = normalizeConversationType(params.conversationType)

  let proficiencyMap = defaultProficiencyMap()
  let source: 'db' | 'client' | 'default' = 'default'

  try {
    const scores = await loadProficiencyScores(params.personId)
    if (Object.keys(scores).length > 0) {
      proficiencyMap = toProficiencyMap(scores)
      source = 'db'
    }
  } catch (error: any) {
    log.error(`Failed to load proficiency, falling back: ${error?.message || error}`)
  }

  if (source === 'default') {
    const fromClient = sanitizeClientScores(params.clientScores)
    if (Object.keys(fromClient).length > 0) {
      proficiencyMap = toProficiencyMap(fromClient)
      source = 'client'
    }
  }

  log.debug(`Tutor prompt proficiency source: ${source}`)
  return buildTutorPrompt({ proficiencyMap, conversationType, language })
}

/**
 * Keep only the five known skill names with finite numeric scores.
 * `toProficiencyMap` clamps to 0-100 afterwards.
 */
export function sanitizeClientScores(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const name of ALL_SKILL_NAMES) {
    const value = (raw as Record<string, unknown>)[name]
    if (typeof value === 'number' && Number.isFinite(value)) out[name] = value
  }
  return out
}
