/**
 * POST /api/notifications/register
 *
 * Stores an Expo push token for the authenticated user so the server can
 * send targeted push notifications in the future.
 *
 * Body: { push_token: string, platform: "ios" | "android" | "web" }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { updateLingoProfile } from '../../lib/db/identity'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const user = await requireAuth(req)

    const { push_token, platform } = req.body || {}

    if (!push_token || typeof push_token !== 'string') {
      return res.status(400).json({ error: 'push_token is required' })
    }

    const validPlatforms = ['ios', 'android', 'web']
    const normalizedPlatform = validPlatforms.includes(platform) ? platform : 'unknown'

    await updateLingoProfile(user.personId, {
      push_token,
      push_token_platform: normalizedPlatform,
      push_token_updated_at: new Date(),
    })

    return res.status(200).json({
      data: { registered: true, platform: normalizedPlatform },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    console.error('[notifications] Registration error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
