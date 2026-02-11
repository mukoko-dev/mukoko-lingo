import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [recentUsers, recentSessions, recentAlerts] = await Promise.all([
      prisma.profile.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { id: true, email: true, displayName: true, createdAt: true, role: true },
      }),
      prisma.studySession.findMany({
        where: { sessionDate: { gte: thirtyDaysAgo } },
        orderBy: { sessionDate: 'desc' },
        take: 50,
        include: { user: { select: { email: true, displayName: true } } },
      }),
      prisma.moderationAlert.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    return res.status(200).json({
      data: {
        recent_users: recentUsers,
        recent_sessions: recentSessions,
        recent_alerts: recentAlerts,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
