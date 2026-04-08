import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'
import { buildTranslationRows } from '../../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const {
      category, english, shona, ndebele, chinese,
      english_pronunciation, shona_pronunciation, ndebele_pronunciation, chinese_pronunciation,
      english_context, shona_context, ndebele_context, chinese_context,
      difficulty, skill_id, required_proficiency, content_type,
    } = req.body || {}

    if (!english || !shona || !ndebele || !chinese) {
      return res.status(400).json({ error: 'All language translations are required' })
    }

    // Insert phrase anchor
    const { data: phrase, error: phraseError } = await supabase
      .from('phrase')
      .insert({
        category: category || 'general',
        content_type: content_type || 'phrase',
        difficulty: difficulty || 'beginner',
        skill_id: skill_id || null,
        required_proficiency: required_proficiency || null,
      })
      .select()
      .single()

    if (phraseError) throw new Error(phraseError.message)

    // Insert translation rows
    const translationRows = buildTranslationRows(phrase.id, req.body)
    const { error: transError } = await supabase
      .from('translation')
      .insert(translationRows)

    if (transError) throw new Error(transError.message)

    return res.status(201).json({ data: phrase })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
