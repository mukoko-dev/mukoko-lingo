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
  /** Why that answer is right. Released with the result, never before it. */
  explanation?: string
  /** Difficulty of the question — caps what answering it can demonstrate. */
  level?: string
}

export interface GradedQuestion {
  questionId: string
  correctAnswer: string
  userAnswer: string
  correct: boolean
  skill?: string
  explanation?: string
}

export interface GradeResult {
  score: number
  total: number
  percentage: number
  passed: boolean
  perQuestion: GradedQuestion[]
  /** Percentage per skill, for a diagnostic that spans several. */
  perSkill: Record<string, number>
  /** Highest score this question set can support, overall and per skill. */
  ceiling: number
  perSkillCeiling: Record<string, number>
}

/**
 * The highest proficiency a set of questions at a given difficulty can
 * demonstrate.
 *
 * A perfect score on beginner questions shows the learner is past beginner. It
 * does not show they are fluent — and until this cap existed, it wrote exactly
 * that: `getDiagnosticQuestions` only ever selects `level: 'beginner'`
 * questions, so a diagnostic could write `current_score: 100` (fluent) for a
 * skill it sampled with one four-option question. `tutor-prompt.ts` reads that
 * number on every AI turn, so the tutor would then address a beginner as a
 * peer. Retakes keep the best score and are unlimited, so guessing until it
 * landed cost a learner nothing.
 *
 * The ceiling is the top of the band **above** the hardest question asked
 * (bands from `scoreToLevel` in `lib/ai/prompt-builder.ts`): mastery of level
 * L content evidences the level above it, and nothing further.
 */
const LEVEL_CEILING: Record<string, number> = {
  beginner: 64, // top of elementary
  elementary: 79, // top of intermediate
  intermediate: 89, // top of advanced
  advanced: 100,
  fluent: 100,
}

/** Unknown or missing difficulty is treated as the easiest — the safe reading. */
export const DEFAULT_LEVEL_CEILING = LEVEL_CEILING.beginner

export function ceilingForLevels(levels: (string | undefined)[]): number {
  let ceiling = DEFAULT_LEVEL_CEILING
  for (const level of levels) {
    const candidate = level ? LEVEL_CEILING[level] : undefined
    if (typeof candidate === 'number' && candidate > ceiling) ceiling = candidate
  }
  return ceiling
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
    const explanation = typeof q.explanation === 'string' ? q.explanation : undefined
    const level = typeof q.level === 'string' ? q.level : typeof q.difficulty === 'string' ? q.difficulty : undefined
    key.push({ questionId, correctAnswer, skill, explanation, level })
  }
  return key
}

/**
 * Answer key for the question ids a submission actually names, taken from the
 * shared bank.
 *
 * This is the path in use today: `lingo.assessments` is empty, and the app's
 * quizzes are drawn from `api/_lib/question-bank.ts`. The ids passed in are
 * the ones `/api/assessments/start` **issued** — never the ids a caller chose
 * to answer, which would let it pick its own denominator.
 */
export function answerKeyFromBank(
  bank: { id: string; correctAnswer: string; skill?: string; explanation?: string; level?: string }[],
  questionIds: string[]
): AnswerKeyEntry[] {
  const wanted = new Set(questionIds)
  return bank
    .filter((q) => wanted.has(q.id))
    .map((q) => ({
      questionId: q.id,
      correctAnswer: q.correctAnswer,
      skill: q.skill,
      explanation: q.explanation,
      level: q.level,
    }))
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
      explanation: entry.explanation,
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

  // What each set of questions can support, by its hardest question.
  const levelByQuestion = new Map(answerKey.map((entry) => [entry.questionId, entry.level]))
  const perSkillCeiling: Record<string, number> = {}
  for (const skill of Object.keys(bySkill)) {
    perSkillCeiling[skill] = ceilingForLevels(
      perQuestion.filter((q) => q.skill === skill).map((q) => levelByQuestion.get(q.questionId))
    )
  }

  return {
    score,
    total,
    percentage,
    passed: total > 0 && percentage >= passingScore,
    perQuestion,
    perSkill,
    ceiling: ceilingForLevels(answerKey.map((entry) => entry.level)),
    perSkillCeiling,
  }
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
 *   demonstrated. Because retakes are unlimited, this makes the ceiling below
 *   load-bearing: without it a learner could guess repeatedly until a lucky
 *   run wrote a score they never earned, and keep it.
 * - **A score cannot exceed what the questions could demonstrate.** The new
 *   percentage is capped by `ceiling` before it is compared with the existing
 *   score — see `ceilingForLevels`. An existing higher score is untouched: the
 *   cap limits what this attempt may claim, it does not revoke past results.
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
  /** Highest score these questions can support; defaults to the safest. */
  ceiling?: number
}): { current_score: number; current_level?: string; level_achieved_at?: Date } | null {
  const { existing, percentage, passed, assessment } = params

  const ceiling = typeof params.ceiling === 'number' ? params.ceiling : DEFAULT_LEVEL_CEILING
  const claimed = Math.min(percentage, ceiling)
  const bestScore = Math.max(existing?.current_score ?? 0, claimed)
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
