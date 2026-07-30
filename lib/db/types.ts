/**
 * MongoDB collection document shapes.
 * Mirrors the collections already live in the Python analytics DB
 * (api/analytics/_helpers.py) where they overlap; introduces the rest for
 * routes that previously lived in Supabase's `lingo`/`system` schemas.
 */

/**
 * identity.persons — the shared, ecosystem-wide user record (Nyuchi
 * platform, `identity` database). Owned by the identity domain, not Lingo;
 * `_id` is a UUID string (used as the OIDC `sub` claim), not an ObjectId.
 * Lingo upserts into this collection on sign-in but never invents its own
 * parallel user table — see `LingoProfile` below for Lingo-specific fields.
 */
export interface Person {
  _id: string
  _schemaVersion: 'v3.1'
  email: string | null
  emailVerified: boolean
  phoneNumber?: string | null
  phoneNumberVerified: boolean
  givenName?: string | null
  familyName?: string | null
  additionalName?: string | null
  name?: string | null
  nickname?: string | null
  preferredUsername?: string | null
  picture?: string | null
  locale?: string | null
  zoneinfo?: string | null
  gender?: string | null
  birthdate?: Date | null
  workosUserId?: string | null
  stytchUserId?: string | null
  isActive: boolean
  lastSeenAt?: Date | null
  createdAt: Date
  updatedAt: Date
  bundu?: {
    familyMembership?: Record<string, unknown>
    defaultFamilyEntityId?: string
    verificationTier?: number
    preferredLanguages?: string[]
  }
}

/**
 * Lingo-local extension of a person — fields the shared `identity.persons`
 * schema has no room for (app role, learning preferences, push tokens).
 * Keyed on `person_id` (identity.persons._id). Lives in Lingo's own
 * `mukoko-lingo` database, collection `learner_profiles`.
 */
export interface LingoProfile {
  _id?: any
  person_id: string
  role: 'user' | 'admin'
  status: 'active' | 'inactive' | 'banned' | 'pending'
  created_at: Date
  last_active?: Date
  deleted_at?: Date | null
  preferred_ui_language?: string
  learning_goal?: string
  daily_goal?: number
  push_token?: string
  push_token_platform?: string
  push_token_updated_at?: Date
  last_study_date?: string
}

export interface PhrasePronunciation {
  english: string
  shona: string
  ndebele: string
  swahili?: string
  chinese: string
}

export interface PhraseContext {
  en: string
  sn: string
  nd: string
  sw?: string
  zh: string
}

export interface Phrase {
  _id?: any
  category: string
  difficulty?: string
  skill_id?: string | null
  required_proficiency?: string | null
  english: string
  shona: string
  ndebele: string
  swahili?: string
  chinese: string
  pronunciation?: PhrasePronunciation
  context?: PhraseContext
  created_at?: Date
}

export interface PhraseProgress {
  _id?: any
  user_id: string
  phrase_id: string
  status: 'learning' | 'practiced' | 'mastered'
  times_practiced: number
  last_practiced_at?: Date
  created_at: Date
  updated_at?: Date
}

export interface Bookmark {
  _id?: any
  user_id: string
  phrase_id: string
  created_at: Date
}

export interface PhraseView {
  _id?: any
  phrase_id: string
  user_id?: string
  viewed_at: Date
}

export interface SkillLevel {
  sort_order: number
  min_score: number
  name?: string
}

export interface Skill {
  _id?: any
  name: string
  display_name: string
  description?: string
  icon?: string
  is_active: boolean
  sort_order: number
  levels?: SkillLevel[]
}

export interface UserSkill {
  _id?: any
  user_id: string
  skill_id: string
  current_score: number
  current_level: string
  level_achieved_at?: Date
}

export interface Assessment {
  _id?: any
  is_active: boolean
  created_at: Date
  type: 'diagnostic' | 'formative' | 'summative'
  skill_id: string
  target_level: string
  questions?: any[]
}

export interface UserAssessment {
  _id?: any
  user_id: string
  skill_id: string
  assessment_id: string
  answers: any
  score: number
  passed: boolean
  time_taken?: number
  completed_at: Date
}

export interface LearningStandard {
  _id?: any
  level_order: number
  title: string
  description?: string
  criteria?: string
  vocabulary_range?: string
  conversation_types?: string[]
  grammar_concepts?: string[]
  ai_prompt_template?: string
  example_phrases?: string[]
  is_active: boolean
}

export interface ModerationAlert {
  _id?: any
  status: 'pending' | 'reviewed' | 'resolved'
  admin_notes?: string
  reviewed_by?: string
  reviewed_at?: Date
  resolved_by?: string
  created_at: Date
}

export interface AiMessage {
  role: 'user' | 'assistant'
  content: string
  created_at: Date
}

export interface AiConversation {
  _id?: any
  user_id: string
  type: string
  language_id: string
  title?: string
  class_id?: string
  messages: AiMessage[]
  updated_at: Date
  created_at: Date
}

export interface SrsCard {
  _id?: any
  user_id: string
  phrase_id: string
  easiness_factor: number
  interval_days: number
  repetition_count: number
  next_review_date: string
  last_review_date?: string | null
  last_quality?: number
  total_reviews: number
}

export interface UserXp {
  _id?: any
  user_id: string
  total_xp: number
  level: number
  daily_goal_xp: number
}

export interface XpEvent {
  _id?: any
  user_id: string
  source: string
  amount: number
  event_date: string
  metadata?: any
  created_at: Date
}

export interface Class {
  _id?: any
  name: string
  description?: string
  organization_id: string
  language_id?: string
  created_by: string
  status: string
  oneroster_sourced_id?: string
  created_at: Date
}

export interface ClassMembership {
  _id?: any
  class_id: string
  person_id: string
  role: 'teacher' | 'student' | 'ta'
  joined_at: Date
}

export interface Assignment {
  _id?: any
  class_id: string
  title: string
  description?: string
  phrase_ids: string[]
  due_date?: string
  status: string
  created_by: string
  created_at: Date
}

export interface AssignmentSubmission {
  _id?: any
  assignment_id: string
  person_id: string
  answers: any
  score?: number
  time_taken?: number
  status: string
  submitted_at: Date
}

export interface OrganizationEnrollment {
  _id?: any
  organization_id: string
  plan: string
  seat_count: number
  enrolled_by: string
  status: string
  enrolled_at: Date
}

export interface ApiKey {
  _id?: any
  name: string
  organization_id: string
  key_hash: string
  key_prefix: string
  scopes: string[]
  created_by: string
  last_used_at?: Date
  expires_at?: Date
  is_active: boolean
  created_at: Date
}

export interface StudySession {
  _id?: any
  user_id: string
  session_date: string
  phrases_studied: number
  time_spent_minutes: number
  created_at?: Date
}

export interface Guardrail {
  _id?: any
  name: string
  description?: string
  category: string
  rule_type: string
  patterns?: string[]
  keywords?: string[]
  ai_instructions?: string
  is_active: boolean
  severity: number
}
