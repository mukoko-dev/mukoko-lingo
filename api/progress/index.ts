import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'
import { flattenPhrases } from '../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const { data: progress, error } = await supabase
        .from('phrase_progress')
        .select(`
          id, phrase_id, status, bookmarked, times_practiced, last_practiced_at, created_at, updated_at,
          phrase:phrase(
            id, category, content_type, difficulty, skill_id, required_proficiency, created_at,
            translations:translation(language_id, text, pronunciation, context)
          )
        `)
        .eq('user_id', user.personId)
        .order('updated_at', { ascending: false })

      if (error) throw new Error(error.message)

      const result = (progress || []).map((p: any) => ({
        ...p,
        phrase: p.phrase ? flattenPhrases([p.phrase])[0] : null,
      }))

      return res.status(200).json({ data: result })
    }

    if (req.method === 'POST') {
      const { phrase_id, status } = req.body || {}
      if (!phrase_id || !status) {
        return res.status(400).json({ error: 'phrase_id and status are required' })
      }

      // Upsert phrase_progress
      const { data: existing } = await supabase
        .from('phrase_progress')
        .select('id, times_practiced')
        .eq('user_id', user.personId)
        .eq('phrase_id', phrase_id)
        .single()

      let result
      if (existing) {
        const { data, error } = await supabase
          .from('phrase_progress')
          .update({
            status,
            times_practiced: existing.times_practiced + 1,
            last_practiced_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        result = data
      } else {
        const { data, error } = await supabase
          .from('phrase_progress')
          .insert({
            user_id: user.personId,
            phrase_id,
            status,
            times_practiced: 1,
            last_practiced_at: new Date().toISOString(),
          })
          .select()
          .single()
        if (error) throw new Error(error.message)
        result = data
      }

      return res.status(200).json({ data: result })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
