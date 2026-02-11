import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import { SESSION_DURATION_MINUTES } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session_token } = req.body || {}
  if (!session_token) {
    return res.status(400).json({ error: 'Session token is required' })
  }

  try {
    const response = await stytchClient.sessions.authenticate({
      session_token,
      session_duration_minutes: SESSION_DURATION_MINUTES,
    })

    return res.status(200).json({
      user: {
        user_id: response.user.user_id,
        email: response.user.emails?.[0]?.email,
        name: response.user.name,
        created_at: response.user.created_at,
        status: response.user.status,
      },
      expires_at: response.session?.expires_at,
    })
  } catch {
    return res.status(401).json({ error: 'Session expired or invalid' })
  }
}
