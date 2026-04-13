/**
 * Auth Middleware for Vercel API Routes
 * Validates Stytch session tokens and maps users to identity.person.
 */

import * as stytch from 'stytch'
import { supabaseIdentity } from './supabase'
import type { VercelRequest } from '@vercel/node'

const STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID || process.env.EXPO_PUBLIC_STYTCH_PROJECT_ID || ''
const STYTCH_SECRET = process.env.STYTCH_SECRET || ''

let _stytchClient: stytch.Client | null = null

function getStytchClient(): stytch.Client {
  if (_stytchClient) return _stytchClient
  if (!STYTCH_PROJECT_ID || !STYTCH_SECRET) {
    const err: any = new Error('Authentication service is not configured. Please set STYTCH_PROJECT_ID and STYTCH_SECRET environment variables.')
    err.status_code = 500
    err.error_type = 'configuration_error'
    err.error_message = err.message
    throw err
  }
  _stytchClient = new stytch.Client({
    project_id: STYTCH_PROJECT_ID,
    secret: STYTCH_SECRET,
  })
  return _stytchClient
}

// Lazy accessor — throws a clear error if credentials are missing
const stytchClient = new Proxy({} as stytch.Client, {
  get(_, prop) {
    return (getStytchClient() as any)[prop]
  },
})

export interface AuthenticatedUser {
  stytchUserId: string
  personId: string
  email: string
  role: string
}

/**
 * Extract and validate the session token from the request
 */
export async function authenticateRequest(req: VercelRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const sessionToken = authHeader.slice(7)
  if (!sessionToken) return null

  try {
    // Validate the session token with Stytch
    const response = await stytchClient.sessions.authenticate({ session_token: sessionToken })
    const stytchUserId = response.session.user_id
    const email = response.user.emails?.[0]?.email || ''

    // Find or create person in identity.person
    let { data: person } = await supabaseIdentity
      .from('person')
      .select('id, email, role, status')
      .eq('email', email)
      .single()

    if (!person) {
      const displayName = response.user.name?.first_name || email.split('@')[0]
      const { data: created, error } = await supabaseIdentity
        .from('person')
        .insert({
          email,
          display_name: displayName,
          role: 'user',
          status: 'active',
        })
        .select('id, email, role, status')
        .single()

      if (error) {
        console.error('[mukoko][auth] Failed to create person:', error.message)
        return null
      }
      person = created
    }

    return {
      stytchUserId,
      personId: person.id,
      email: person.email,
      role: person.role || 'user',
    }
  } catch (error: any) {
    const message = error?.error_message || error?.message || 'Auth validation failed'
    console.error(`[mukoko][auth] Session validation failed: ${message}`)
    return null
  }
}

/**
 * Require authentication - returns user or throws
 */
export async function requireAuth(req: VercelRequest): Promise<AuthenticatedUser> {
  const user = await authenticateRequest(req)
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

/**
 * Require admin role
 */
export async function requireAdmin(req: VercelRequest): Promise<AuthenticatedUser> {
  const user = await requireAuth(req)
  if (user.role !== 'admin') {
    throw new Error('Forbidden')
  }
  return user
}

export { stytchClient }
