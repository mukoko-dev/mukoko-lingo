/**
 * Auth Middleware for Vercel API Routes
 * Validates WorkOS AuthKit access tokens and maps users to identity.person.
 */

import { WorkOS } from '@workos-inc/node'
import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'
import { findOrCreatePersonFromWorkOS } from '../../lib/db/identity'
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

/** How long after expiry a token is still accepted for logout revocation. */
const EXPIRED_TOKEN_TOLERANCE_SECONDS = 30 * 24 * 60 * 60

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

    // Find or create the identity.persons record, keyed on the stable
    // WorkOS user id (not email, which can change) — atomic upsert against
    // the shared ecosystem identity collection, not a Lingo-local table.
    const profile = await findOrCreatePersonFromWorkOS({
      id: workosUserId,
      email: workosUser.email,
      firstName: workosUser.firstName,
      lastName: workosUser.lastName,
    })

    return {
      workosUserId,
      personId: profile.id,
      email: profile.email || workosUser.email,
      role: profile.role,
    }
  } catch (error: any) {
    const message = error?.error_message || error?.message || 'Auth validation failed'
    console.error(`[mukoko][auth] Access token validation failed: ${message}`)
    return null
  }
}

/**
 * Verify an access token's signature and expiry against WorkOS's JWKS and
 * return its claims, or null if it is not a valid token.
 *
 * Use this instead of `decodeJwt` anywhere a claim is going to be acted on:
 * `decodeJwt` only base64-decodes the payload, so its output is attacker
 * controlled for any caller willing to hand-craft a token.
 */
export async function verifyAccessToken(
  accessToken: string,
  options: { allowExpired?: boolean } = {}
): Promise<Record<string, any> | null> {
  if (!accessToken) return null
  try {
    const { payload } = await jwtVerify(accessToken, getJwks())
    return payload as Record<string, any>
  } catch (error: any) {
    // Logout still needs to revoke the session behind an access token that has
    // since expired — they are short-lived and the client does not refresh
    // before signing out, so requiring an unexpired token meant revocation
    // silently never happened. Retry with a wide clock tolerance: the
    // signature and every other claim are still verified, only the expiry
    // window widens, and a token older than this is not worth revoking.
    if (options.allowExpired && error?.code === 'ERR_JWT_EXPIRED') {
      try {
        const { payload } = await jwtVerify(accessToken, getJwks(), {
          clockTolerance: EXPIRED_TOKEN_TOLERANCE_SECONDS,
        })
        return payload as Record<string, any>
      } catch {
        // fall through to the failure log below
      }
    }
    const message = error?.error_message || error?.message || 'Token verification failed'
    console.error(`[mukoko][auth] Access token verification failed: ${message}`)
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
