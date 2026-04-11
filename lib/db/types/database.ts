/**
 * Supabase Generated Types — Mukoko Lingo
 *
 * Generated via Supabase MCP (`generate_typescript_types`) from the
 * live schema of project `yqmqdiudhztddiyeerig`.
 *
 * Regenerate with:
 *   npx supabase gen types typescript --project-id yqmqdiudhztddiyeerig > lib/db/types/database.ts
 *
 * Note: only `public` schema is covered here. `lingo` and `identity`
 * are exposed to PostgREST but type generation currently only emits
 * the default schema. Query them via
 *   supabasePublic.schema('lingo').from('phrase')...
 * and cast the return manually for now.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '13.0.5'
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null
          daily_goal: number | null
          display_name: string | null
          email: string
          last_study_date: string | null
          learning_goal: string | null
          preferred_ui_language: string | null
          role: string | null
          status: string | null
          study_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_goal?: number | null
          display_name?: string | null
          email: string
          last_study_date?: string | null
          learning_goal?: string | null
          preferred_ui_language?: string | null
          role?: string | null
          status?: string | null
          study_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_goal?: number | null
          display_name?: string | null
          email?: string
          last_study_date?: string | null
          learning_goal?: string | null
          preferred_ui_language?: string | null
          role?: string | null
          status?: string | null
          study_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}

/**
 * Lingo schema — partial hand-written types for tables the client reads.
 * These live in the `lingo` schema which is exposed to PostgREST but
 * not covered by the auto-generator yet.
 */
export interface LingoPhrase {
  id: string
  category: string
  content_type: string | null
  difficulty: string | null
  skill_id: string | null
  required_proficiency: string | null
  created_at: string
}

export interface LingoTranslation {
  id: string
  phrase_id: string
  language_id: string
  text: string | null
  pronunciation: string | null
  context: string | null
}

export interface LingoLanguage {
  id: string
  code: string
  name: string
  native_name: string | null
}

/**
 * SRS + XP tables — server-only access via the Supabase secret key.
 * These types match the shapes defined in lib/services/srs.ts and
 * lib/services/xp.ts, but snake-cased for the SQL column names.
 */
export interface SRSCardRow {
  id: string
  person_id: string
  phrase_id: string
  easiness_factor: number
  interval_days: number
  repetitions: number
  next_review_date: string
  last_review_date: string | null
  last_quality: number | null
  total_reviews: number
  created_at: string
  updated_at: string
}

export interface UserXPRow {
  person_id: string
  total_xp: number
  level: number
  daily_goal_xp: number
  today_xp: number
  today_date: string
  weekly_xp: number
  week_start_date: string
  created_at: string
  updated_at: string
}

export interface XPEventRow {
  id: string
  person_id: string
  source:
    | 'phrase_learned'
    | 'quiz_correct'
    | 'quiz_perfect'
    | 'srs_review'
    | 'ai_chat'
    | 'assessment_completed'
    | 'assessment_passed'
    | 'daily_goal_bonus'
    | 'streak_milestone'
  amount: number
  event_date: string
  created_at: string
}
