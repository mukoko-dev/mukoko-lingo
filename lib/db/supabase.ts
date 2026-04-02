/**
 * Supabase Client Singleton
 * Server-side only - used by API routes / Vercel serverless functions
 *
 * Provides database access via Supabase client connected to PostgreSQL.
 * Default schema is 'lingo'. Use schemaClient() for other schemas.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('[mukoko][db] Missing credentials: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
}

/**
 * Supabase client for the `lingo` schema (default)
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'lingo' },
  auth: { persistSession: false },
})

/**
 * Supabase client for the `identity` schema
 */
export const supabaseIdentity = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'identity' },
  auth: { persistSession: false },
})

/**
 * Supabase client for the `system` schema
 */
export const supabaseSystem = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'system' },
  auth: { persistSession: false },
})

export default supabase
