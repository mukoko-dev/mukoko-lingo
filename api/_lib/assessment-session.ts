/**
 * Assessment sessions — the server's record of which questions it issued.
 *
 * Grading against "the questions the caller sent answers for" is not grading.
 * `answerKeyFromBank(bank, Object.keys(answers))` built the key from the
 * submitted ids, so a caller could submit one correct answer, score 1/1, and
 * write `user_skills.current_score = 100` — the same forged proficiency the
 * server-side grading was introduced to prevent, reached by choosing the
 * denominator instead of the numerator. `user_skills.current_score` is read by
 * `tutor-prompt.ts` on every AI turn, so that number is not cosmetic.
 *
 * So the server now issues the quiz: `/api/assessments/start` picks the
 * questions, stores their ids here, and returns them without answers.
 * `/api/assessments/submit` grades against the stored ids. An unanswered
 * question is wrong, an id that was never issued is ignored, and the caller
 * has no say in either.
 *
 * Pure functions — no database, no HTTP.
 */

import { randomUUID } from 'crypto'

/** How long an issued quiz stays valid. Long enough to think, short enough to expire. */
export const SESSION_TTL_MS = 2 * 60 * 60 * 1000

/** Bounds on an issued quiz. The client asks; these decide. */
export const MIN_QUESTIONS = 3
export const MAX_QUESTIONS = 25
export const DEFAULT_SKILL_QUESTIONS = 5
export const DEFAULT_DIAGNOSTIC_QUESTIONS = 8

export interface AssessmentSessionDoc {
  _id: string
  user_id: string
  /** As the caller named it — a `skills._id`, a skill name, or `diagnostic`. */
  skill_id: string
  /** Resolved `skills._id`, when the catalogue knows this skill. */
  resolved_skill_id: string | null
  assessment_id: string | null
  question_ids: string[]
  is_diagnostic: boolean
  language: string | null
  created_at: Date
  expires_at: Date
  submitted_at: Date | null
}

export class InvalidSessionError extends Error {
  /** HTTP status this maps to: 400 for a bad ask, 404/409/410 for a bad session. */
  readonly status: number

  constructor(message: string, status = 400) {
    super(message)
    this.name = 'InvalidSessionError'
    this.status = status
  }
}

/**
 * How many questions to issue.
 *
 * The caller may ask, within bounds — a request for 500 questions, or for one
 * (which would make any single correct answer a perfect score), is clamped
 * rather than refused, because neither is worth failing a learner over.
 */
export function resolveQuestionCount(requested: unknown, isDiagnostic: boolean): number {
  const fallback = isDiagnostic ? DEFAULT_DIAGNOSTIC_QUESTIONS : DEFAULT_SKILL_QUESTIONS
  if (typeof requested !== 'number' || !Number.isFinite(requested)) return fallback
  return Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Math.round(requested)))
}

export function buildSessionDoc(params: {
  userId: string
  skillId: string
  resolvedSkillId: string | null
  assessmentId?: string | null
  questionIds: string[]
  isDiagnostic: boolean
  language?: string | null
  now?: Date
}): AssessmentSessionDoc {
  const now = params.now ?? new Date()
  if (params.questionIds.length === 0) {
    throw new InvalidSessionError('No questions available for this assessment', 422)
  }

  return {
    _id: randomUUID(),
    user_id: params.userId,
    skill_id: params.skillId,
    resolved_skill_id: params.resolvedSkillId,
    assessment_id: params.assessmentId ?? null,
    question_ids: params.questionIds,
    is_diagnostic: params.isDiagnostic,
    language: params.language ?? null,
    created_at: now,
    expires_at: new Date(now.getTime() + SESSION_TTL_MS),
    submitted_at: null,
  }
}

/**
 * Check a session may be graded, and that it belongs to the caller.
 *
 * Ownership is checked here rather than in the query so that someone else's
 * session id is a 404, not a silent grade against their quiz.
 */
export function assertSessionUsable(
  session: AssessmentSessionDoc | null,
  userId: string,
  now: Date = new Date()
): AssessmentSessionDoc {
  if (!session || session.user_id !== userId) {
    throw new InvalidSessionError('Assessment session not found', 404)
  }
  if (session.submitted_at) {
    // Single use: a session that could be graded twice is a session that can be
    // retried until the answers come out right.
    throw new InvalidSessionError('This assessment has already been submitted', 409)
  }
  if (session.expires_at instanceof Date && session.expires_at.getTime() <= now.getTime()) {
    throw new InvalidSessionError('This assessment has expired; start a new one', 410)
  }
  return session
}
