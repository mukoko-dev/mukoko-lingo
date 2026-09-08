/**
 * Assessment submission — graded **server-side**.
 *
 * The caller sends answers. It does not send a score: this route computes one
 * from an answer key it resolves itself, and only that number is persisted or
 * used to promote a skill level. A body carrying `score` or `passed` is
 * rejected rather than ignored, on the same reasoning as the client-supplied
 * `system` role in `api/_lib/chat-input.ts` — a caller sending it has either
 * misunderstood the contract or is probing it, and both are worth surfacing.
 *
 * This matters beyond unlocking content: `user_skills.current_score` is read
 * by `api/_lib/tutor-prompt.ts` for every AI turn, so a forged score changes
 * how Shamwari teaches that learner.
 *
 * The answer key comes from the `lingo.assessments` document when one exists
 * and carries questions; otherwise from the shared bank in
 * `lib/data/assessment-questions.ts`, which is what the app builds its
 * assessments from today.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { createLogger } from '../_lib/logger'
import { findById } from '../_lib/doc-id'
import { userAssessments, assessments, userSkills, skills } from '../_lib/mongo'
import {
  sanitizeAnswers,
  answerKeyFromAssessment,
  answerKeyFromBank,
  gradeAnswers,
  resolvePassingScore,
  resolveSkillUpdate,
  InvalidSubmissionError,
} from '../_lib/assessment-grading'
import { assessmentQuestions } from '../../lib/data/assessment-questions'

const log = createLogger('assessments')

/**
 * `user_skills.skill_id` is a `skills._id` UUID, which the tutor prompt joins
 * back to a name; the bundled question bank labels skills by name. Writing a
 * name into that column would create rows every reader silently ignores, so
 * callers may send either and the server resolves to the id.
 */
async function resolveSkillIds(
  skillsCol: { find: (filter: any) => { toArray: () => Promise<any[]> } },
  values: string[]
): Promise<Map<string, string>> {
  const wanted = values.filter(Boolean)
  if (wanted.length === 0) return new Map()

  const docs = await skillsCol.find({ $or: [{ _id: { $in: wanted } }, { name: { $in: wanted } }] }).toArray()

  const byValue = new Map<string, string>()
  for (const doc of docs) {
    const id = String(doc._id)
    if (wanted.includes(id)) byValue.set(id, id)
    if (typeof doc.name === 'string' && wanted.includes(doc.name)) byValue.set(doc.name, id)
  }
  return byValue
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)
    const body = (req.body || {}) as Record<string, unknown>

    // Not silently dropped: a caller sending these believes it decides the
    // outcome, and that belief is exactly what this route no longer honours.
    if ('score' in body || 'passed' in body) {
      return res.status(400).json({
        error: 'score and passed are computed server-side; submit answers only',
      })
    }

    const skillId = typeof body.skill_id === 'string' ? body.skill_id : null
    if (!skillId) return res.status(400).json({ error: 'skill_id is required' })

    const assessmentId = typeof body.assessment_id === 'string' ? body.assessment_id : null
    const timeTaken = typeof body.time_taken === 'number' && Number.isFinite(body.time_taken)
      ? Math.max(0, Math.round(body.time_taken))
      : null

    let answers: Record<string, string>
    try {
      answers = sanitizeAnswers(body.answers)
    } catch (error) {
      if (error instanceof InvalidSubmissionError) {
        return res.status(400).json({ error: error.message })
      }
      throw error
    }

    // The assessment document is optional — the app assembles quizzes from the
    // shared bank — but when one exists it owns the key, the pass mark and the
    // level a pass unlocks.
    const assessmentsCol = await assessments()
    const assessment = assessmentId ? await findById<any>(assessmentsCol, assessmentId) : null

    const fromAssessment = answerKeyFromAssessment(assessment)
    const answerKey = fromAssessment.length > 0
      ? fromAssessment
      : answerKeyFromBank(assessmentQuestions, Object.keys(answers))

    if (answerKey.length === 0) {
      // Recording a hollow zero would be worse than refusing: it would look
      // like a failed attempt the learner actually made.
      log.error(
        `No answer key for submission by ${user.personId} (assessment_id=${assessmentId ?? 'none'}, ${Object.keys(answers).length} answers)`
      )
      return res.status(422).json({ error: 'No answer key found for these questions' })
    }

    const result = gradeAnswers(answerKey, answers, resolvePassingScore(assessment))
    const now = new Date()

    // A diagnostic spans several skills, so score each one the key covers.
    // Names come from the key entries, the body's skill_id may be either an id
    // or a name, and both resolve to a `skills._id` before anything is written.
    const skillsCol = await skills()
    const perSkillNames = Object.keys(result.perSkill)
    const resolved = await resolveSkillIds(skillsCol, [skillId, ...perSkillNames])
    const primarySkillId = resolved.get(skillId) ?? null

    const skillResults = perSkillNames.length > 0
      ? perSkillNames.map((name) => ({ name, skillId: resolved.get(name) ?? null, percentage: result.perSkill[name] }))
      : [{ name: skillId, skillId: primarySkillId, percentage: result.percentage }]

    const userAssessmentsCol = await userAssessments()
    const insertResult = await userAssessmentsCol.insertOne({
      user_id: user.personId,
      assessment_id: assessmentId,
      skill_id: primarySkillId ?? skillId,
      answers,
      score: result.percentage,
      passed: result.passed,
      time_taken: timeTaken,
      completed_at: now,
    } as any)

    const userSkillsCol = await userSkills()
    const updatedSkills: string[] = []
    let levelAchieved: string | null = null

    for (const entry of skillResults) {
      if (!entry.skillId) {
        // The attempt is still recorded; only the skill row is skipped.
        log.error(`Cannot resolve skill "${entry.name}" to a skills._id — not updating user_skills`)
        continue
      }

      // Only the skill the assessment was taken for can be promoted: one
      // `target_level` says nothing about the other skills a diagnostic
      // happened to touch.
      const promotable = entry.skillId === primarySkillId ? assessment : null
      const existing = await userSkillsCol.findOne({ user_id: user.personId, skill_id: entry.skillId })
      const update = resolveSkillUpdate({
        existing,
        percentage: entry.percentage,
        passed: entry.percentage >= resolvePassingScore(assessment),
        assessment: promotable,
      })
      if (!update) continue

      await userSkillsCol.findOneAndUpdate(
        { user_id: user.personId, skill_id: entry.skillId },
        { $set: update, $setOnInsert: { user_id: user.personId, skill_id: entry.skillId } },
        { upsert: true }
      )
      updatedSkills.push(entry.skillId)
      if (update.current_level) levelAchieved = update.current_level
    }

    return res.status(201).json({
      data: {
        id: String(insertResult.insertedId),
        user_id: user.personId,
        assessment_id: assessmentId,
        skill_id: primarySkillId ?? skillId,
        score: result.percentage,
        correct: result.score,
        total: result.total,
        passed: result.passed,
        // Returned so a client can show a review without shipping the answer
        // key in its own bundle.
        results: result.perQuestion,
        per_skill: result.perSkill,
        skills_updated: updatedSkills,
        level_achieved: levelAchieved,
        time_taken: timeTaken,
        completed_at: now,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    log.error(`Assessment submission failed: ${error?.message || error}`)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
