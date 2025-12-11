/**
 * Skills System Types
 * AI-First Skills-Based Learning Architecture
 */

export type SkillName = 'pronunciation' | 'vocabulary' | 'grammar' | 'comprehension' | 'conversation'

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'fluent'

export type AssessmentType = 'diagnostic' | 'formative' | 'summative'

export type QuestionType = 'multiple_choice' | 'fill_blank' | 'pronunciation' | 'listening' | 'translation'

/**
 * Core Skill Definition
 */
export interface Skill {
  id: string
  name: SkillName
  display_name: Record<string, string>
  description: Record<string, string>
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

/**
 * Proficiency Level for a Skill
 */
export interface SkillLevel {
  id: string
  skill_id: string
  level: ProficiencyLevel
  display_name: Record<string, string>
  description: Record<string, string>
  min_score: number
  sort_order: number
}

/**
 * User's Current Skill Proficiency
 * CRITICAL: Read by AI tutor to adapt teaching
 */
export interface UserSkill {
  user_id: string
  skill_id: string
  current_level: ProficiencyLevel
  current_score: number
  total_practice_time: number
  last_practiced_at?: string
  level_achieved_at: string
  created_at: string
  updated_at: string
}

/**
 * User Skill with Related Data
 */
export interface UserSkillWithDetails extends UserSkill {
  skill: Skill
  level: SkillLevel
}

/**
 * Assessment Question
 */
export interface Question {
  id: string
  type: QuestionType
  question: Record<string, string>
  options?: string[]
  correct_answer: string | string[]
  explanation?: Record<string, string>
  points: number
  audio_url?: string
  image_url?: string
}

/**
 * Assessment Template
 */
export interface Assessment {
  id: string
  skill_id: string
  type: AssessmentType
  target_level: ProficiencyLevel
  title: Record<string, string>
  description?: Record<string, string>
  questions: Question[]
  passing_score: number
  time_limit?: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * User's Answer to a Question
 */
export interface UserAnswer {
  question_id: string
  answer: string | string[]
  correct: boolean
  points_earned: number
  time_taken?: number
}

/**
 * User Assessment Attempt
 */
export interface UserAssessment {
  id: string
  user_id: string
  assessment_id: string
  skill_id: string
  answers: UserAnswer[]
  score: number
  passed: boolean
  time_taken?: number
  feedback?: {
    overall: string
    skill_specific: Record<string, string>
    next_steps: string[]
  }
  started_at: string
  completed_at: string
}

/**
 * AI Tutor Context
 */
export interface AITutorContext {
  user_id: string
  overall_proficiency: ProficiencyLevel
  skills: Array<{
    skill_name: SkillName
    current_level: ProficiencyLevel
    current_score: number
    needs_improvement: boolean
  }>
  recent_assessments: Array<{
    skill_name: SkillName
    score: number
    passed: boolean
    completed_at: string
  }>
  learning_preferences?: {
    preferred_language: string
    learning_pace: 'slow' | 'moderate' | 'fast'
    focus_areas: SkillName[]
  }
}

/**
 * Helper type for AI prompt building
 */
export type SkillProficiencyMap = {
  [K in SkillName]?: {
    level: ProficiencyLevel
    score: number
  }
}

/**
 * Skills Dashboard Summary
 */
export interface SkillsDashboardSummary {
  user_id: string
  overall_proficiency: ProficiencyLevel
  overall_score: number
  skills: Array<{
    skill: Skill
    user_skill: UserSkill
    level_info: SkillLevel
    progress_to_next: number
    recommended_actions: string[]
  }>
  total_practice_time: number
  assessments_completed: number
  assessments_passed: number
  phrases_mastered: number
  current_streak: number
  last_practice: string
}
