/**
 * Supabase Client — Public / Client-Side
 *
 * Used directly from Expo/React Native app code for read-only queries
 * against public data (phrases, categories, skills, etc). Uses the
 * **publishable key** (new Supabase API keys — the legacy anon/service
 * role keys are deprecated).
 *
 * For writes that require authentication, use the Stytch session token
 * with a dedicated API route. For custom server-side logic, use
 * Supabase Edge Functions — this keeps the Expo bundle light.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''

// New Supabase publishable key (replaces legacy anon key). Falls back to
// the legacy var names so existing deployments keep working during rollout.
const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.warn(
    '[mukoko][db] Client Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY.'
  )
}

/**
 * Public client for the `lingo` schema — read-only via RLS.
 *
 * Falls back to placeholder values when env vars are not set so that
 * `createClient` never throws at module-init time. Use
 * `isSupabasePublicConfigured()` before making actual queries.
 */
export const supabasePublic = createClient(
  SUPABASE_URL || 'https://not-configured.supabase.co',
  SUPABASE_PUBLISHABLE_KEY || 'not-configured',
  {
    db: { schema: 'lingo' },
    auth: { persistSession: false },
  }
)

/**
 * Whether the client-side Supabase connection is configured.
 */
export function isSupabasePublicConfigured(): boolean {
  return !!(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)
}
