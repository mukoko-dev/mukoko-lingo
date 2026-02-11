/**
 * Auth Middleware for Vercel API Routes
 * Validates Stytch session tokens and provides user context.
 */

import * as stytch from 'stytch'
import prisma from './prisma'
import type { VercelRequest } from '@vercel/node'

const STYTCH_PROJECT_ID = process.env.STYTCH_PROJECT_ID || process.env.EXPO_PUBLIC_STYTCH_PROJECT_ID || ''
const STYTCH_SECRET = process.env.STYTCH_SECRET || ''

if (!STYTCH_PROJECT_ID || !STYTCH_SECRET) {
  console.error('[auth] Missing Stytch credentials: STYTCH_PROJECT_ID and STYTCH_SECRET must be set in environment variables')
}

const stytchClient = new stytch.Client({
  project_id: STYTCH_PROJECT_ID,
  secret: STYTCH_SECRET,
})

export interface AuthenticatedUser {
  stytchUserId: string
  profileId: string
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

    // Find or create profile in MongoDB
    let profile = await prisma.profile.findUnique({
      where: { stytchUserId },
    })

    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          stytchUserId,
          email,
          displayName: response.user.name?.first_name || email.split('@')[0],
        },
      })
    }

    return {
      stytchUserId,
      profileId: profile.id,
      email: profile.email,
      role: profile.role,
    }
  } catch {
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
