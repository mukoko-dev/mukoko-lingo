/**
 * Issue an assessment — the server chooses the questions.
 *
 * `POST /api/assessments/start` with `{ skill_id, language?, count? }` returns
 * a `session_id` and the questions **without their answers**. The learner
 * answers them and posts the lot to `/api/assessments/submit`, which grades
 * against the ids stored here.
 *
 * This exists because grading against the ids a caller chose to answer is not
 * grading: `answerKeyFromBank(bank, Object.keys(answers))` let a caller submit
 * one correct answer, score 1/1, and write `user_skills.current_score = 100`,
 * which `tutor-prompt.ts` then reads on every AI turn. The numerator was
 * already the server's; now the denominator is too.
 *
 * `skill_id` may be a `skills._id`, a skill name, or the literal `diagnostic`.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { createLogger } from '../_lib/logger'
import { findById } from '../_lib/doc-id'
import { resolveSkillIds, resolveSkillName } from '../_lib/skill-ids'
import { assessmentSessions, assessments, skills } from '../_lib/mongo'
import {
  buildSessionDoc,
  resolveQuestionCount,
  InvalidSessionError,
} from '../_lib/assessment-session'
import {
  getQuestionsForSkill,
  getDiagnosticQuestions,
  questionsByIds,
  toPublicQuestion,
} from '../_lib/question-bank'
import type { ProficiencyLevel, SkillName } from '../../lib/types/skills'

const log = createLogger('assessments')

const DIAGNOSTIC = 'diagnostic'
const KNOWN_LANGUAGES = ['shona', 'ndebele', 'swahili', 'chinese']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)
    const body = (req.body || {}) as Record<string, unknown>

    const skillId = typeof body.skill_id === 'string' ? body.skill_id : null
    if (!skillId) return res.status(400).json({ error: 'skill_id is required' })

    const assessmentId = typeof body.assessment_id === 'string' ? body.assessment_id : null
    // Allowlisted rather than passed through: the value reaches a bank filter.
    const language =
      typeof body.language === 'string' && KNOWN_LANGUAGES.includes(body.language) ? body.language : null

    const isDiagnostic = skillId === DIAGNOSTIC
    const count = resolveQuestionCount(body.count, isDiagnostic)

    const skillsCol = await skills()
    const skillName = isDiagnostic ? null : await resolveSkillName(skillsCol, skillId)
    const resolved = isDiagnostic ? new Map() : await resolveSkillIds(skillsCol, [skillId])
    const resolvedSkillId = resolved.get(skillId) ?? null

    // A seeded assessment owns its own question list; the bank is the fallback
    // the app actually runs on today.
    const assessmentsCol = await assessments()
    const assessment = assessmentId ? await findById<any>(assessmentsCol, assessmentId) : null

    let questionIds: string[]
    if (assessment && Array.isArray(assessment.questions) && assessment.questions.length > 0) {
      questionIds = assessment.questions
        .map((q: any) => (typeof q?.id === 'string' ? q.id : typeof q?.question_id === 'string' ? q.question_id : null))
        .filter((id: string | null): id is string => Boolean(id))
    } else if (isDiagnostic) {
      questionIds = pickIds(getDiagnosticQuestions(language ?? undefined, count), () =>
        getDiagnosticQuestions(undefined, count)
      )
    } else {
      // The bank keys on skill names, so an unknown skill has no questions.
      const name = (skillName ?? skillId) as SkillName
      const level = ((typeof body.level === 'string' ? body.level : 'beginner') as ProficiencyLevel) || 'beginner'
      questionIds = pickIds(getQuestionsForSkill(name, level, language ?? undefined, count), () =>
        getQuestionsForSkill(name, level, undefined, count)
      )
    }

    let session
    try {
      session = buildSessionDoc({
        userId: user.personId,
        skillId,
        resolvedSkillId,
        assessmentId,
        questionIds,
        isDiagnostic,
        language,
      })
    } catch (error) {
      if (error instanceof InvalidSessionError) {
        log.error(`No questions for assessment request (skill=${skillId}, language=${language ?? 'any'})`)
        return res.status(error.status).json({ error: error.message })
      }
      throw error
    }

    const sessionsCol = await assessmentSessions()
    await sessionsCol.insertOne(session as any)

    // The answer key stays here. `toPublicQuestion` is the only shape that
    // crosses the boundary, and it carries no correctAnswer or explanation.
    const questions = questionsByIds(session.question_ids).map(toPublicQuestion)

    return res.status(201).json({
      data: {
        session_id: session._id,
        skill_id: skillId,
        questions,
        expires_at: session.expires_at,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    log.error(`Could not start assessment: ${error?.message || error}`)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Ids for a selection, falling back when a language filter leaves too few.
 *
 * The old client did the same thing: a learner studying Ndebele should get a
 * short quiz in any language rather than an empty screen.
 */
function pickIds(preferred: { id: string }[], fallback: () => { id: string }[]): string[] {
  const chosen = preferred.length >= 3 ? preferred : fallback()
  return chosen.map((q) => q.id)
}
