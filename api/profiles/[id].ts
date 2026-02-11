import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth, requireAdmin } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    if (req.method === 'GET') {
      const user = await requireAuth(req)
      // Users can only get their own profile unless admin
      if (user.profileId !== id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const profile = await prisma.profile.findUnique({ where: { id: id as string } })
      return res.status(200).json({ data: profile })
    }

    if (req.method === 'PUT') {
      const user = await requireAuth(req)
      if (user.profileId !== id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const profile = await prisma.profile.update({
        where: { id: id as string },
        data: {
          ...(req.body.display_name !== undefined && { displayName: req.body.display_name }),
          ...(req.body.preferred_ui_language && { preferredUiLang: req.body.preferred_ui_language }),
          ...(req.body.learning_goal !== undefined && { learningGoal: req.body.learning_goal }),
          ...(req.body.daily_goal !== undefined && { dailyGoal: req.body.daily_goal }),
        },
      })
      return res.status(200).json({ data: profile })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
