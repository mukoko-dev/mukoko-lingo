import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { getMergedProfile, updateLingoProfile } from '../../lib/db/identity'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const profile = await getMergedProfile(user.personId)
      if (!profile) return res.status(404).json({ error: 'Profile not found' })
      return res.status(200).json({ data: profile })
    }

    if (req.method === 'PUT') {
      const update: Record<string, any> = {}
      if (req.body.preferred_ui_language) update.preferred_ui_language = req.body.preferred_ui_language
      if (req.body.learning_goal !== undefined) update.learning_goal = req.body.learning_goal
      if (req.body.daily_goal !== undefined) update.daily_goal = req.body.daily_goal

      const profile = await updateLingoProfile(user.personId, update)
      if (!profile) return res.status(404).json({ error: 'Profile not found' })
      return res.status(200).json({ data: profile })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
