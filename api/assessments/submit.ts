/**
 * Assessment submission — graded **server-side, against the questions the
 * server issued**.
 *
 * The caller sends a `session_id` and answers. It does not send a score, and
 * it does not decide which questions count: both were the ways a learner could
 * write their own `user_skills.current_score`, which `api/_lib/tutor-prompt.ts`
 * reads on every AI turn, so a forged score changes how Shamwari teaches.
 *
 * - A body carrying `score` or `passed` is rejected rather than ignored, on
 *   the same reasoning as a client-supplied `system` role in
 *   `api/_lib/chat-input.ts`: a caller sending it has either misunderstood the
 *   contract or is probing it.
 * - The answer key is the `question_ids` of the session — the set
 *   `/api/assessments/start` chose. Answering one of five questions is 20%,
 *   not 100%, because `total` no longer depends on what was submitted.
 * - A session is single use and expires, so a quiz cannot be re-graded until
 *   the answers come out right.
 * - A persisted score is capped by the difficulty of the questions asked.
 *   Diagnostics are drawn entirely from beginner-level questions, so a perfect
 *   diagnostic evidences elementary, not fluency — see `ceilingForLevels`.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { createLogger } from '../_lib/logger'
import { findById } from '../_lib/doc-id'
import { resolveSkillIds } from '../_lib/skill-ids'
import { assessmentSessions, userAssessments, assessments, userSkills, skills } from '../_lib/mongo'
import {
  sanitizeAnswers,
  answerKeyFromAssessment,
  answerKeyFromBank,
  gradeAnswers,
  resolvePassingScore,
  resolveSkillUpdate,
  InvalidSubmissionError,
} from '../_lib/assessment-grading'
import { assertSessionUsable, InvalidSessionError } from '../_lib/assessment-session'
import { assessmentQuestions } from '../_lib/question-bank'

const log = createLogger('assessments')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)
    const body = (req.body || {}) as Record<string, unknown>

    if ('score' in body || 'passed' in body) {
      return res.status(400).json({
        error: 'score and passed are computed server-side; submit answers only',
      })
    }

    const sessionId = typeof body.session_id === 'string' ? body.session_id : null
    if (!sessionId) {
      return res.status(400).json({
        error: 'session_id is required; start the assessment with POST /api/assessments/start',
      })
    }

    const timeTaken =
      typeof body.time_taken === 'number' && Number.isFinite(body.time_taken)
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

    const sessionsCol = await assessmentSessions()
    let session
    try {
      session = assertSessionUsable((await sessionsCol.findOne({ _id: sessionId })) as any, user.personId)
    } catch (error) {
      if (error instanceof InvalidSessionError) {
        return res.status(error.status).json({ error: error.message })
      }
      throw error
    }

    // Claim the session before grading. A concurrent second submit finds it
    // already claimed and is refused, rather than both grading the same quiz.
    const claim = await sessionsCol.findOneAndUpdate(
      { _id: sessionId, submitted_at: null },
      { $set: { submitted_at: new Date() } }
    )
    if (!claim || (typeof claim === 'object' && 'value' in claim && !claim.value)) {
      return res.status(409).json({ error: 'This assessment has already been submitted' })
    }

    const assessmentsCol = await assessments()
    const assessment = session.assessment_id ? await findById<any>(assessmentsCol, session.assessment_id) : null

    // The key covers exactly what was issued: an unanswered question is wrong,
    // and an id that was never issued is not graded at all.
    const issued = new Set(session.question_ids)
    const fromAssessment = answerKeyFromAssessment(assessment).filter((entry) => issued.has(entry.questionId))
    const answerKey =
      fromAssessment.length > 0 ? fromAssessment : answerKeyFromBank(assessmentQuestions, session.question_ids)

    if (answerKey.length === 0) {
      // The session named questions neither source can grade — a bank edited
      // between issue and submit. Recording a hollow zero would look like a
      // failed attempt the learner made.
      log.error(
        `No answer key for session ${sessionId} (${session.question_ids.length} issued, assessment=${session.assessment_id ?? 'none'})`
      )
      return res.status(422).json({ error: 'No answer key found for these questions' })
    }

    const result = gradeAnswers(answerKey, answers, resolvePassingScore(assessment))
    const now = new Date()

    const skillsCol = await skills()
    const perSkillNames = Object.keys(result.perSkill)
    const resolved = await resolveSkillIds(skillsCol, [session.skill_id, ...perSkillNames])
    const primarySkillId = session.resolved_skill_id ?? resolved.get(session.skill_id) ?? null

    // A diagnostic spans several skills, so score each one the key covers.
    const skillResults =
      perSkillNames.length > 0
        ? perSkillNames.map((name) => ({
            name,
            skillId: resolved.get(name) ?? null,
            percentage: result.perSkill[name],
            // Per skill, not overall: a diagnostic can ask one skill a harder
            // question than another, and each score is capped by its own.
            ceiling: result.perSkillCeiling[name],
          }))
        : [{ name: session.skill_id, skillId: primarySkillId, percentage: result.percentage, ceiling: result.ceiling }]

    const userAssessmentsCol = await userAssessments()
    const insertResult = await userAssessmentsCol.insertOne({
      user_id: user.personId,
      session_id: sessionId,
      assessment_id: session.assessment_id,
      skill_id: primarySkillId ?? session.skill_id,
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
        ceiling: entry.ceiling,
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
        session_id: sessionId,
        assessment_id: session.assessment_id,
        skill_id: primarySkillId ?? session.skill_id,
        score: result.percentage,
        correct: result.score,
        total: result.total,
        passed: result.passed,
        // The answers, released now that the attempt is closed — this is what
        // lets the client show a review without ever holding the key itself.
        results: result.perQuestion,
        per_skill: result.perSkill,
        // What the questions asked could demonstrate. A perfect run on
        // beginner questions is a perfect run on beginner questions.
        score_ceiling: result.ceiling,
        per_skill_ceiling: result.perSkillCeiling,
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
