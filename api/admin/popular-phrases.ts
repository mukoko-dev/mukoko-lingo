import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'
import { flattenPhrases } from '../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    // Use phrase_stats_cache for popular phrases (Doris domain cache)
    const { data: stats, error } = await supabase
      .from('phrase_stats_cache')
      .select(`
        phrase_id, view_count, bookmark_count,
        phrase:phrase(
          id, category, content_type, difficulty, skill_id, required_proficiency, created_at,
          translations:translation(language_id, text, pronunciation, context)
        )
      `)
      .order('view_count', { ascending: false })
      .limit(20)

    if (error) throw new Error(error.message)

    const results = (stats || []).map((s: any) => ({
      ...flattenPhrases([s.phrase])[0],
      view_count: s.view_count,
      bookmark_count: s.bookmark_count,
    }))

    return res.status(200).json({ data: results })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
