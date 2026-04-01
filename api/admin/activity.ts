import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import supabase, { supabaseIdentity } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const since = thirtyDaysAgo.toISOString()

    const [
      { data: recentUsers },
      { data: recentSessions },
      { data: recentAlerts },
    ] = await Promise.all([
      supabaseIdentity
        .from('person')
        .select('id, email, display_name, created_at, role')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('study_session')
        .select('*')
        .gte('session_date', since)
        .order('session_date', { ascending: false })
        .limit(50),
      supabase
        .from('moderation_alert')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return res.status(200).json({
      data: {
        recent_users: recentUsers || [],
        recent_sessions: recentSessions || [],
        recent_alerts: recentAlerts || [],
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
