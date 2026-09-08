/**
 * Assessment grading — pure functions, no database and no HTTP.
 *
 * Scoring used to happen in the client (`calculateAssessmentScore` in
 * `lib/data/assessment-questions.ts`) and `/api/assessments/submit` recorded
 * whatever `score` and `passed` the caller sent. Anyone who could reach the
 * route could promote their own proficiency, and `user_skills.current_score`
 * is read by `api/_lib/tutor-prompt.ts` for every AI turn — so a forged score
 * did not merely unlock content, it changed how Shamwari teaches.
 *
 * The server now grades from the submitted answers against an answer key it
 * resolves itself. The client may still grade locally for immediate feedback;
 * only what this module computes is ever persisted.
 */

/** One question's key, from either the DB assessment or the shared bank. */
export interface AnswerKeyEntry {
  questionId: string
  correctAnswer: string
  /** Skill this question tests, when known — diagnostics span several. */
  skill?: string
}

export interface GradedQuestion {
  questionId: string
  correctAnswer: string
  userAnswer: string
  correct: boolean
  skill?: string
}

export interface GradeResult {
  score: number
  total: number
  percentage: number
  passed: boolean
  perQuestion: GradedQuestion[]
  /** Percentage per skill, for a diagnostic that spans several. */
  perSkill: Record<string, number>
}

/** Used when the assessment document does not set its own `passing_score`. */
export const DEFAULT_PASSING_SCORE = 70

/** Guard rails on a submission body; mirrors `api/_lib/chat-input.ts`. */
export const MAX_ANSWERS = 200
export const MAX_ANSWER_CHARS = 500

export class InvalidSubmissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidSubmissionError'
  }
}

/**
 * Answers as `{ [questionId]: answer }`, rejecting anything that is not a
 * flat map of strings.
 *
 * A caller cannot smuggle objects or arrays through: they would never match a
 * key entry, but they would be stored verbatim in `user_assessments`.
 */
export function sanitizeAnswers(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new InvalidSubmissionError('answers must be an object of questionId → answer')
  }

  const entries = Object.entries(raw as Record<string, unknown>)
  if (entries.length === 0) throw new InvalidSubmissionError('answers cannot be empty')
  if (entries.length > MAX_ANSWERS) {
    throw new InvalidSubmissionError(`answers cannot exceed ${MAX_ANSWERS} questions`)
  }

  const clean: Record<string, string> = {}
  for (const [questionId, answer] of entries) {
    if (typeof answer !== 'string') {
      throw new InvalidSubmissionError(`answer for ${questionId} must be a string`)
    }
    if (answer.length > MAX_ANSWER_CHARS) {
      throw new InvalidSubmissionError(`answer for ${questionId} exceeds ${MAX_ANSWER_CHARS} characters`)
    }
    clean[questionId] = answer
  }
  return clean
}

/**
 * Read the answer key out of a `lingo.assessments` document.
 *
 * The collection is empty today and has no seeder, so both the bank's
 * camelCase and this database's snake_case spellings are accepted rather than
 * betting on one. A question with no id or no correct answer is skipped: a key
 * entry that cannot be graded would silently count against the learner.
 */
export function answerKeyFromAssessment(assessment: { questions?: unknown } | null): AnswerKeyEntry[] {
  const questions = assessment?.questions
  if (!Array.isArray(questions)) return []

  const key: AnswerKeyEntry[] = []
  for (const raw of questions) {
    if (!raw || typeof raw !== 'object') continue
    const q = raw as Record<string, unknown>
    const questionId = typeof q.id === 'string' ? q.id : typeof q.question_id === 'string' ? q.question_id : null
    const correctAnswer =
      typeof q.correctAnswer === 'string'
        ? q.correctAnswer
        : typeof q.correct_answer === 'string'
          ? q.correct_answer
          : null
    if (!questionId || !correctAnswer) continue

    const skill = typeof q.skill === 'string' ? q.skill : undefined
    key.push({ questionId, correctAnswer, skill })
  }
  return key
}

/**
 * Answer key for the question ids a submission actually names, taken from the
 * shared bank.
 *
 * This is the path in use today: `lingo.assessments` is empty, and the app
 * builds its assessments from `lib/data/assessment-questions.ts`. Only ids the
 * bank knows are graded, so an invented id cannot pad the total in either
 * direction.
 */
export function answerKeyFromBank(
  bank: { id: string; correctAnswer: string; skill?: string }[],
  questionIds: string[]
): AnswerKeyEntry[] {
  const wanted = new Set(questionIds)
  return bank
    .filter((q) => wanted.has(q.id))
    .map((q) => ({ questionId: q.id, correctAnswer: q.correctAnswer, skill: q.skill }))
}

/**
 * Compare one answer.
 *
 * Trimmed and case-insensitive. For multiple choice this changes nothing (the
 * client sends an option verbatim); for the translation and fill-in-the-blank
 * types it is deliberately more forgiving than the old client-side `===`,
 * which failed a learner for a capital letter.
 */
function matches(userAnswer: string | undefined, correctAnswer: string): boolean {
  if (typeof userAnswer !== 'string') return false
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}

/**
 * Grade a submission against its key.
 *
 * `total` is the size of the **key**, never the number of answers submitted:
 * scoring one correct answer out of ten questions is 10%, not 100%. An
 * unanswered question is simply wrong.
 */
export function gradeAnswers(
  answerKey: AnswerKeyEntry[],
  answers: Record<string, string>,
  passingScore: number = DEFAULT_PASSING_SCORE
): GradeResult {
  const perQuestion: GradedQuestion[] = answerKey.map((entry) => {
    const userAnswer = answers[entry.questionId]
    return {
      questionId: entry.questionId,
      correctAnswer: entry.correctAnswer,
      userAnswer: typeof userAnswer === 'string' ? userAnswer : '',
      correct: matches(userAnswer, entry.correctAnswer),
      skill: entry.skill,
    }
  })

  const total = perQuestion.length
  const score = perQuestion.filter((q) => q.correct).length
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0

  const bySkill: Record<string, { correct: number; total: number }> = {}
  for (const q of perQuestion) {
    if (!q.skill) continue
    if (!bySkill[q.skill]) bySkill[q.skill] = { correct: 0, total: 0 }
    bySkill[q.skill].total++
    if (q.correct) bySkill[q.skill].correct++
  }
  const perSkill: Record<string, number> = {}
  for (const [skill, tally] of Object.entries(bySkill)) {
    perSkill[skill] = Math.round((tally.correct / tally.total) * 100)
  }

  return { score, total, percentage, passed: total > 0 && percentage >= passingScore, perQuestion, perSkill }
}

/** The assessment's own threshold, when it sets a sane one. */
export function resolvePassingScore(assessment: { passing_score?: unknown } | null): number {
  const raw = assessment?.passing_score
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return DEFAULT_PASSING_SCORE
  if (raw < 0 || raw > 100) return DEFAULT_PASSING_SCORE
  return raw
}

/**
 * What to write to `user_skills`, or null when nothing should change.
 *
 * Two rules the old route did not have:
 *
 * - **The score never goes down.** A learner retaking an assessment and doing
 *   worse keeps their best result; the tutor should not un-learn what they
 *   demonstrated.
 * - **A level is only promoted by a real assessment document that names a
 *   `target_level`.** The bundled question bank has no notion of a target
 *   level, so a bank-graded pass records a score and stops there. Inventing a
 *   promotion from a client-assembled quiz is exactly the hole this closes.
 */
export function resolveSkillUpdate(params: {
  existing: { current_score?: number; current_level?: string } | null
  percentage: number
  passed: boolean
  assessment: { target_level?: unknown } | null
}): { current_score: number; current_level?: string; level_achieved_at?: Date } | null {
  const { existing, percentage, passed, assessment } = params

  const bestScore = Math.max(existing?.current_score ?? 0, percentage)
  const targetLevel = typeof assessment?.target_level === 'string' ? assessment.target_level : null
  const promote = passed && Boolean(targetLevel)

  // Nothing to write: no promotion, and the new score is not an improvement.
  if (!promote && bestScore === (existing?.current_score ?? 0) && existing) return null

  const update: { current_score: number; current_level?: string; level_achieved_at?: Date } = {
    current_score: bestScore,
  }
  if (promote && targetLevel) {
    update.current_level = targetLevel
    update.level_achieved_at = new Date()
  }
  return update
}
