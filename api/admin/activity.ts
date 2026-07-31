import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import { studySessions, moderationAlerts } from '../_lib/mongo'
import { recentMergedProfiles } from '../../lib/db/identity'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sinceDateStr = thirtyDaysAgo.toISOString().split('T')[0]

    const [sessionsCol, alertsCol] = await Promise.all([studySessions(), moderationAlerts()])

    const [recentUsers, recentSessions, recentAlerts] = await Promise.all([
      recentMergedProfiles(thirtyDaysAgo, 20),
      sessionsCol.find({ session_date: { $gte: sinceDateStr } }).sort({ session_date: -1 }).limit(50).toArray(),
      alertsCol.find({ created_at: { $gte: thirtyDaysAgo } }).sort({ created_at: -1 }).limit(20).toArray(),
    ])

    return res.status(200).json({
      data: {
        recent_users: recentUsers,
        recent_sessions: recentSessions.map((s: any) => ({ ...s, id: String(s._id) })),
        recent_alerts: recentAlerts.map((a: any) => ({ ...a, id: String(a._id) })),
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
