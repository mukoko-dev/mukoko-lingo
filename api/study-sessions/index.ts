import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const sessions = await prisma.studySession.findMany({
        where: { userId: user.profileId },
        orderBy: { sessionDate: 'desc' },
        take: 30,
      })
      return res.status(200).json({ data: sessions })
    }

    if (req.method === 'POST') {
      const { phrases_studied, time_spent_minutes } = req.body || {}

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const session = await prisma.studySession.upsert({
        where: {
          userId_sessionDate: { userId: user.profileId, sessionDate: today },
        },
        create: {
          userId: user.profileId,
          sessionDate: today,
          phrasesStudied: phrases_studied || 0,
          timeSpentMinutes: time_spent_minutes || 0,
        },
        update: {
          phrasesStudied: { increment: phrases_studied || 0 },
          timeSpentMinutes: { increment: time_spent_minutes || 0 },
        },
      })

      // Update study streak
      await prisma.profile.update({
        where: { id: user.profileId },
        data: {
          lastStudyDate: new Date(),
          lastActive: new Date(),
        },
      })

      return res.status(200).json({ data: session })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
