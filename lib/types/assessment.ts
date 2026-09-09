/**
 * The assessment shapes the client is allowed to know about.
 *
 * Types only — this module compiles away, so importing it ships nothing. The
 * question bank itself lives in `api/_lib/question-bank.ts` and never reaches
 * the client bundle: it carries every `correctAnswer`, and a learner who can
 * read the answers can pass any assessment without learning anything.
 *
 * A question therefore arrives from `/api/assessments/start` with its answer
 * and explanation removed. Both come back after grading, in the submit
 * response, which is when the learner is meant to see them.
 */

import type { SkillName, ProficiencyLevel } from './skills'

export type AssessmentQuestionType = 'multiple_choice' | 'translation' | 'fill_blank'
export type AssessmentQuestionLanguage = 'shona' | 'ndebele' | 'swahili' | 'chinese' | 'all'

/** A question as issued to a client: everything needed to answer, nothing more. */
export interface PublicAssessmentQuestion {
  id: string
  skill: SkillName
  level: ProficiencyLevel
  type: AssessmentQuestionType
  question: string
  options: string[]
  language: AssessmentQuestionLanguage
}

/** `POST /api/assessments/start` — the issued quiz. */
export interface AssessmentSessionResponse {
  session_id: string
  skill_id: string
  questions: PublicAssessmentQuestion[]
  expires_at: string
}

/** One graded question in the `POST /api/assessments/submit` response. */
export interface GradedQuestionResult {
  questionId: string
  correctAnswer: string
  userAnswer: string
  correct: boolean
  skill?: string
  explanation?: string
}

/** `POST /api/assessments/submit` — the server's verdict, the only one that counts. */
export interface AssessmentSubmitResponse {
  id: string
  skill_id: string
  score: number
  correct: number
  total: number
  passed: boolean
  results: GradedQuestionResult[]
  per_skill: Record<string, number>
  /** Highest score the questions asked could support (see `ceilingForLevels`). */
  score_ceiling: number
  per_skill_ceiling: Record<string, number>
  skills_updated: string[]
  level_achieved: string | null
  time_taken: number | null
  completed_at: string
}
