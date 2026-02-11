import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { stytchClient } from '../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session_token } = req.body || {}
  if (!session_token) {
    return res.status(400).json({ error: 'Session token is required' })
  }

  try {
    await stytchClient.sessions.revoke({ session_token })
    return res.status(200).json({ success: true })
  } catch {
    // Even if revocation fails, consider it a success
    return res.status(200).json({ success: true })
  }
}
