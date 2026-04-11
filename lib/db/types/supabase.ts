// AUTO-GENERATED via Supabase MCP (`generate_typescript_types`)
// Source: mukoko_lingo_db project (yqmqdiudhztddiyeerig)
//
// Re-generate by running the Supabase CLI:
//   supabase gen types typescript --project-id yqmqdiudhztddiyeerig > lib/db/types/supabase.ts
//
// Note: only schemas exposed to PostgREST are included. lingo/identity
// schemas are exposed via ALTER ROLE authenticator SET pgrst.db_schemas
// but may require a second regeneration pass after the PostgREST
// schema cache rebuilds.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      phrases: {
        Row: {
          category: string
          chinese: string
          chinese_context: string
          chinese_pronunciation: string
          created_at: string
          english: string
          english_context: string
          english_pronunciation: string
          id: string
          ndebele: string
          ndebele_context: string
          ndebele_pronunciation: string
          shona: string
          shona_context: string
          shona_pronunciation: string
        }
        Insert: Partial<Database["public"]["Tables"]["phrases"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["phrases"]["Row"]>
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          phrase_id: string
          user_id: string
        }
        Insert: Partial<Database["public"]["Tables"]["bookmarks"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["bookmarks"]["Row"]>
        Relationships: []
      }
      phrase_progress: {
        Row: {
          created_at: string | null
          id: string
          last_practiced_at: string | null
          phrase_id: string
          status: string
          times_practiced: number | null
          user_id: string
        }
        Insert: Partial<Database["public"]["Tables"]["phrase_progress"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["phrase_progress"]["Row"]>
        Relationships: []
      }
      study_sessions: {
        Row: {
          created_at: string | null
          id: string
          phrases_studied: number | null
          session_date: string | null
          time_spent_minutes: number | null
          user_id: string
        }
        Insert: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]>
        Update: Partial<Database["public"]["Tables"]["study_sessions"]["Row"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
