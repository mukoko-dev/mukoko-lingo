import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { workos, verifyAccessToken } from '../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { access_token } = req.body || {}

  try {
    if (access_token) {
      // Verify before trusting `sid`. This used to call `decodeJwt`, which only
      // base64-decodes the payload — so any caller could POST a hand-crafted,
      // unsigned token carrying someone else's session id and have the server
      // revoke that session for them.
      const payload = await verifyAccessToken(access_token)
      const sid = typeof payload?.sid === 'string' ? payload.sid : undefined
      if (sid) await workos.userManagement.revokeSession({ sessionId: sid })
    }
  } catch {
    // Even if revocation fails, consider it a success — client-side clearing is authoritative
  }

  // Always 200: the client clears its own session regardless, and reporting
  // whether revocation happened would tell an unauthenticated caller whether a
  // token/session was valid.
  return res.status(200).json({ success: true })
}
