import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import supabase from '../_lib/supabase'
import { flattenPhrases } from '../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { category, difficulty, content_type } = req.query

    let query = supabase
      .from('phrase')
      .select(`
        id, category, content_type, difficulty, skill_id, required_proficiency, created_at,
        translations:translation(language_id, text, pronunciation, context)
      `)
      .order('created_at', { ascending: false })
      .limit(200)

    if (category) query = query.eq('category', category as string)
    if (difficulty) query = query.eq('difficulty', difficulty as string)
    if (content_type) query = query.eq('content_type', content_type as string)

    const { data: phrases, error } = await query

    if (error) throw new Error(error.message)

    const flat = flattenPhrases(phrases || [])
    return res.status(200).json({ data: flat, count: flat.length })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
