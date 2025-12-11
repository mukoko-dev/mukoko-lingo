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
 * Represents one of the 5 core skills that drive learning
 */
export interface Skill {
  id: string
  name: SkillName
  display_name: Record<string, string> // Multi-language skill names
  description: Record<string, string> // Multi-language descriptions
  icon?: string // Lucide icon name
  sort_order: number
  is_active: boolean
  created_at: string
}

/**
 * Proficiency Level for a Skill
 * Defines what each level means for a specific skill
 */
export interface SkillLevel {
  id: string
  skill_id: string
  level: ProficiencyLevel
  display_name: Record<string, string>
  description: Record<string, string>
  min_score: number // 0-100 score threshold
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
  current_score: number // 0-100
  total_practice_time: number // Seconds
  last_practiced_at?: string
  level_achieved_at: string
  created_at: string
  updated_at: string
}

/**
 * User Skill with Related Data
 * For dashboard and detailed views
 */
export interface UserSkillWithDetails extends UserSkill {
  skill: Skill
  level: SkillLevel
}

/**
 * Assessment Question
 * Individual question in an assessment
 */
export interface Question {
  id: string
  type: QuestionType
  question: Record<string, string> // Multi-language question text
  options?: string[] // For multiple choice
  correct_answer: string | string[] // Single or multiple correct answers
  explanation?: Record<string, string> // Why this is correct
  points: number // Points awarded for correct answer
  audio_url?: string // For listening questions
  image_url?: string // For visual questions
}

/**
 * Assessment Template
 * Created by admins to evaluate skills
 */
export interface Assessment {
  id: string
  skill_id: string
  type: AssessmentType
  target_level: ProficiencyLevel
  title: Record<string, string>
  description?: Record<string, string>
  questions: Question[]
  passing_score: number // Percentage (0-100)
  time_limit?: number // Seconds
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

/**
 * Assessment with Related Data
 */
export interface AssessmentWithDetails extends Assessment {
  skill: Skill
}

/**
 * User's Answer to a Question
 */
export interface UserAnswer {
  question_id: string
  answer: string | string[]
  correct: boolean
  points_earned: number
  time_taken?: number // Seconds
}

/**
 * User Assessment Attempt
 * Result of taking an assessment
 */
export interface UserAssessment {
  id: string
  user_id: string
  assessment_id: string
  skill_id: string
  answers: UserAnswer[]
  score: number // Percentage (0-100)
  passed: boolean
  time_taken?: number // Seconds
  feedback?: {
    overall: string
    skill_specific: Record<string, string>
    next_steps: string[]
  }
  started_at: string
  completed_at: string
}

/**
 * User Assessment with Related Data
 */
export interface UserAssessmentWithDetails extends UserAssessment {
  assessment: AssessmentWithDetails
}

/**
 * AI Tutor Context
 * Proficiency information passed to AI for adaptive teaching
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
 * Phrase with Skills Data
 * Extended phrase type with skills-based fields
 */
export interface SkillsBasedPhrase {
  id: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  category: string
  skill_id: string
  required_level: ProficiencyLevel
  learning_objectives?: string[]
  cultural_notes?: Record<string, string>
  difficulty_score: number // 1-5
}

/**
 * Recommended Phrase
 * Phrase with relevance score for user
 */
export interface RecommendedPhrase extends SkillsBasedPhrase {
  skill_name: SkillName
  relevance_score: number // 0-1, higher = more relevant
  reason?: string // Why this is recommended
}

/**
 * Skills Dashboard Summary
 * Overview of user's progress across all skills
 */
export interface SkillsDashboardSummary {
  user_id: string
  overall_proficiency: ProficiencyLevel
  overall_score: number
  skills: Array<{
    skill: Skill
    user_skill: UserSkill
    level_info: SkillLevel
    progress_to_next: number // Percentage to next level
    recent_assessments: UserAssessment[]
    recommended_actions: string[]
  }>
  total_practice_time: number // Seconds
  assessments_completed: number
  assessments_passed: number
  phrases_mastered: number
  current_streak: number
  last_practice: string
}

/**
 * Assessment Results Summary
 * Detailed breakdown of assessment performance
 */
export interface AssessmentResultsSummary {
  user_assessment: UserAssessmentWithDetails
  skill_breakdown: Array<{
    skill_name: SkillName
    questions_attempted: number
    questions_correct: number
    accuracy: number
    areas_for_improvement: string[]
  }>
  level_recommendation: {
    current: ProficiencyLevel
    suggested: ProficiencyLevel
    reasoning: string
  }
  next_steps: string[]
  unlock_progress: {
    phrases_unlocked: number
    next_unlock_at: number // Score needed
  }
}

/**
 * Level Progression Info
 * Details about progression between levels
 */
export interface LevelProgressionInfo {
  current_level: ProficiencyLevel
  current_score: number
  next_level?: ProficiencyLevel
  next_level_threshold?: number
  progress_percentage: number // To next level
  assessments_required: number
  estimated_practice_time: number // Hours
}

/**
 * Skill Recommendation
 * AI-generated recommendation for skill improvement
 */
export interface SkillRecommendation {
  skill_name: SkillName
  priority: 'high' | 'medium' | 'low'
  reason: string
  suggested_actions: Array<{
    type: 'practice' | 'assessment' | 'review'
    description: string
    estimated_time: number // Minutes
  }>
  relevant_phrases: RecommendedPhrase[]
}

/**
 * Helper type for frontend form validation
 */
export interface CreateAssessmentRequest {
  skill_id: string
  type: AssessmentType
  target_level: ProficiencyLevel
  title: Record<string, string>
  description?: Record<string, string>
  questions: Omit<Question, 'id'>[]
  passing_score: number
  time_limit?: number
}

/**
 * Helper type for submitting assessment
 */
export interface SubmitAssessmentRequest {
  assessment_id: string
  skill_id: string
  answers: Array<{
    question_id: string
    answer: string | string[]
  }>
  time_taken?: number
}

/**
 * Helper type for AI prompt building
 */
export interface SkillProficiencyMap {
  [key in SkillName]?: {
    level: ProficiencyLevel
    score: number
  }
}
