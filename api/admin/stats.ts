import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { createLogger } from '../_lib/logger'
import { requireAdmin } from '../_lib/auth-middleware'
import supabase, { supabaseIdentity } from '../_lib/supabase'

const log = createLogger('admin-stats')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [
      { count: totalUsers },
      { count: totalAdmins },
      { count: totalPhrases },
      { count: totalProgress },
      { count: totalBookmarks },
      { count: totalViews },
      { count: activeUsers },
    ] = await Promise.all([
      supabaseIdentity.from('person').select('*', { count: 'exact', head: true }).is('deleted_at', null),
      supabaseIdentity.from('person').select('*', { count: 'exact', head: true }).eq('role', 'admin').is('deleted_at', null),
      supabase.from('phrase').select('*', { count: 'exact', head: true }),
      supabase.from('phrase_progress').select('*', { count: 'exact', head: true }),
      supabase.from('phrase_progress').select('*', { count: 'exact', head: true }).eq('bookmarked', true),
      supabase.from('phrase_view').select('*', { count: 'exact', head: true }),
      supabaseIdentity.from('person').select('*', { count: 'exact', head: true }).gte('last_active', sevenDaysAgo.toISOString()).is('deleted_at', null),
    ])

    return res.status(200).json({
      data: {
        total_users: totalUsers || 0,
        total_admins: totalAdmins || 0,
        total_phrases: totalPhrases || 0,
        total_progress_records: totalProgress || 0,
        total_bookmarks: totalBookmarks || 0,
        total_views: totalViews || 0,
        active_users: activeUsers || 0,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    log.error('Failed to fetch stats', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
