/**
 * Auth Middleware for Vercel API Routes
 * Validates WorkOS AuthKit access tokens and maps users to identity.person.
 */

import { WorkOS } from '@workos-inc/node'
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { profiles } from './mongo'
import type { VercelRequest } from '@vercel/node'

const WORKOS_API_KEY = process.env.WORKOS_API_KEY || ''
const WORKOS_CLIENT_ID = process.env.WORKOS_CLIENT_ID || process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID || ''

let _workos: WorkOS | null = null

function getWorkOSClient(): WorkOS {
  if (_workos) return _workos
  if (!WORKOS_API_KEY || !WORKOS_CLIENT_ID) {
    const err: any = new Error('Authentication service is not configured. Please set WORKOS_API_KEY and WORKOS_CLIENT_ID environment variables.')
    err.status_code = 500
    err.error_type = 'configuration_error'
    err.error_message = err.message
    throw err
  }
  _workos = new WorkOS(WORKOS_API_KEY, { clientId: WORKOS_CLIENT_ID })
  return _workos
}

// Lazy accessor — throws a clear error if credentials are missing
const workos = new Proxy({} as WorkOS, {
  get(_, prop) {
    return (getWorkOSClient() as any)[prop]
  },
})

let _jwks: JWTVerifyGetKey | null = null

function getJwks(): JWTVerifyGetKey {
  if (_jwks) return _jwks
  const client = getWorkOSClient()
  _jwks = createRemoteJWKSet(new URL(client.userManagement.getJwksUrl(WORKOS_CLIENT_ID)))
  return _jwks
}

export interface AuthenticatedUser {
  workosUserId: string
  personId: string
  email: string
  role: string
}

/**
 * Extract and validate the WorkOS access token from the request
 */
export async function authenticateRequest(req: VercelRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const accessToken = authHeader.slice(7)
  if (!accessToken) return null

  try {
    // Verify the access token's signature and expiry locally against WorkOS's JWKS
    const { payload } = await jwtVerify(accessToken, getJwks())
    const workosUserId = payload.sub
    if (!workosUserId) return null

    // Access tokens don't carry email, so resolve the user's profile from WorkOS
    const workosUser = await workos.userManagement.getUser(workosUserId)
    const email = workosUser.email

    // Find or create the profile, keyed on the stable workos_user_id (not
    // email, which can change) — atomic upsert, no separate select-then-insert.
    const col = await profiles()
    const person = await col.findOneAndUpdate(
      { workos_user_id: workosUserId },
      {
        $setOnInsert: {
          workos_user_id: workosUserId,
          email,
          display_name: workosUser.firstName || email.split('@')[0],
          role: 'user',
          status: 'active',
          created_at: new Date(),
        },
      },
      { upsert: true, returnDocument: 'after' }
    )

    if (!person) {
      console.error('[mukoko][auth] Failed to find or create profile')
      return null
    }

    return {
      workosUserId,
      personId: String(person._id),
      email: person.email,
      role: person.role || 'user',
    }
  } catch (error: any) {
    const message = error?.error_message || error?.message || 'Auth validation failed'
    console.error(`[mukoko][auth] Access token validation failed: ${message}`)
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

export { workos, WORKOS_CLIENT_ID }
