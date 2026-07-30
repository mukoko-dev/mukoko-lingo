import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { workos, WORKOS_CLIENT_ID } from '../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { refresh_token } = req.body || {}
  if (!refresh_token) {
    return res.status(400).json({ error: 'refresh_token is required' })
  }

  try {
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithRefreshToken({
      clientId: WORKOS_CLIENT_ID,
      refreshToken: refresh_token,
    })

    return res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { user_id: user.id, email: user.email },
    })
  } catch (error: any) {
    console.error('[mukoko][auth] Refresh failed:', error.error_message || error.message)
    if (error.error_type === 'configuration_error') {
      return res.status(500).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    return res.status(401).json({ error: 'Session expired or invalid' })
  }
}
