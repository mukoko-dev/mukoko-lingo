import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const profile = await prisma.profile.findUnique({
        where: { id: user.profileId },
      })
      return res.status(200).json({ data: profile })
    }

    if (req.method === 'PUT') {
      const profile = await prisma.profile.update({
        where: { id: user.profileId },
        data: {
          ...(req.body.display_name && { displayName: req.body.display_name }),
          ...(req.body.preferred_ui_language && { preferredUiLang: req.body.preferred_ui_language }),
          ...(req.body.learning_goal && { learningGoal: req.body.learning_goal }),
          ...(req.body.daily_goal && { dailyGoal: req.body.daily_goal }),
        },
      })
      return res.status(200).json({ data: profile })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
