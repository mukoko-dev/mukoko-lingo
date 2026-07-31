import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { createLogger } from '../_lib/logger'
import { requireAdmin } from '../_lib/auth-middleware'
import { phrases, phraseProgress, bookmarks, phraseViews } from '../_lib/mongo'
import { countLingoProfiles } from '../../lib/db/identity'

const log = createLogger('admin-stats')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [phrasesCol, progressCol, bookmarksCol, viewsCol] = await Promise.all([
      phrases(),
      phraseProgress(),
      bookmarks(),
      phraseViews(),
    ])

    const [totalUsers, totalAdmins, totalPhrases, totalProgress, totalBookmarks, totalViews, activeUsers] =
      await Promise.all([
        countLingoProfiles(),
        countLingoProfiles({ role: 'admin' }),
        phrasesCol.countDocuments(),
        progressCol.countDocuments(),
        bookmarksCol.countDocuments(),
        viewsCol.countDocuments(),
        countLingoProfiles({ last_active: { $gte: sevenDaysAgo } }),
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
    log.error('Failed to fetch stats', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
