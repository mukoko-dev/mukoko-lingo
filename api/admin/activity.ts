import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import { profiles, studySessions, moderationAlerts } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const sinceDateStr = thirtyDaysAgo.toISOString().split('T')[0]

    const [profilesCol, sessionsCol, alertsCol] = await Promise.all([
      profiles(),
      studySessions(),
      moderationAlerts(),
    ])

    const [recentUsers, recentSessions, recentAlerts] = await Promise.all([
      profilesCol
        .find({ created_at: { $gte: thirtyDaysAgo } })
        .project({ email: 1, display_name: 1, created_at: 1, role: 1 })
        .sort({ created_at: -1 })
        .limit(20)
        .toArray(),
      sessionsCol.find({ session_date: { $gte: sinceDateStr } }).sort({ session_date: -1 }).limit(50).toArray(),
      alertsCol.find({ created_at: { $gte: thirtyDaysAgo } }).sort({ created_at: -1 }).limit(20).toArray(),
    ])

    return res.status(200).json({
      data: {
        recent_users: recentUsers.map((u: any) => ({ ...u, id: String(u._id) })),
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
