import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      totalUsers,
      totalAdmins,
      totalPhrases,
      totalProgress,
      totalBookmarks,
      totalViews,
      activeUsers,
    ] = await Promise.all([
      prisma.profile.count({ where: { deletedAt: null } }),
      prisma.profile.count({ where: { role: 'admin', deletedAt: null } }),
      prisma.phrase.count(),
      prisma.phraseProgress.count(),
      prisma.bookmark.count(),
      prisma.phraseView.count(),
      prisma.profile.count({
        where: { lastActive: { gte: sevenDaysAgo }, deletedAt: null },
      }),
    ])

    return res.status(200).json({
      data: {
        total_users: totalUsers,
        total_admins: totalAdmins,
        total_phrases: totalPhrases,
        total_progress_records: totalProgress,
        total_bookmarks: totalBookmarks,
        total_views: totalViews,
        active_users: activeUsers,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
