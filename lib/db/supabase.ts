/**
 * Supabase Client Singleton
 * Server-side only — used by API routes / Vercel serverless functions
 * and Supabase Edge Functions.
 *
 * Uses the **secret key** (new Supabase API keys). Falls back to the
 * legacy service_role key for backwards compatibility during rollout.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''

// New Supabase secret key (replaces legacy service_role). The legacy
// env var is kept as a fallback during migration.
const SUPABASE_SECRET_KEY =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  ''

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('[mukoko][db] Missing credentials: SUPABASE_URL and SUPABASE_SECRET_KEY must be set')
}

/**
 * Supabase client for the `lingo` schema (default)
 */
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  db: { schema: 'lingo' },
  auth: { persistSession: false },
})

/**
 * Supabase client for the `identity` schema
 */
export const supabaseIdentity = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  db: { schema: 'identity' },
  auth: { persistSession: false },
})

/**
 * Supabase client for the `system` schema
 */
export const supabaseSystem = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  db: { schema: 'system' },
  auth: { persistSession: false },
})

export default supabase
