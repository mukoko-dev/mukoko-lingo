import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import supabase from '../_lib/supabase'
import { flattenPhrase } from '../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const { data: phrase, error } = await supabase
      .from('phrase')
      .select(`
        id, category, content_type, difficulty, skill_id, required_proficiency, created_at,
        translations:translation(language_id, text, pronunciation, context)
      `)
      .eq('id', id as string)
      .single()

    if (error || !phrase) return res.status(404).json({ error: 'Phrase not found' })
    return res.status(200).json({ data: flattenPhrase(phrase) })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
