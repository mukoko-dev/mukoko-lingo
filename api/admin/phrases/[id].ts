import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'
import { LANG_CODE_MAP } from '../../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    await requireAdmin(req)

    if (req.method === 'PUT') {
      // Update phrase metadata
      const phraseUpdate: Record<string, any> = {}
      if (req.body.category !== undefined) phraseUpdate.category = req.body.category
      if (req.body.content_type !== undefined) phraseUpdate.content_type = req.body.content_type
      if (req.body.difficulty !== undefined) phraseUpdate.difficulty = req.body.difficulty
      if (req.body.skill_id !== undefined) phraseUpdate.skill_id = req.body.skill_id
      if (req.body.required_proficiency !== undefined) phraseUpdate.required_proficiency = req.body.required_proficiency

      if (Object.keys(phraseUpdate).length > 0) {
        const { error } = await supabase.from('phrase').update(phraseUpdate).eq('id', id as string)
        if (error) throw new Error(error.message)
      }

      // Upsert translations for each language
      for (const [langName, langCode] of Object.entries(LANG_CODE_MAP)) {
        const text = req.body[langName]
        if (text === undefined) continue

        const translationData = {
          phrase_id: id as string,
          language_id: langCode,
          text,
          pronunciation: req.body[`${langName}_pronunciation`] ?? null,
          context: req.body[`${langName}_context`] ?? null,
        }

        // Try update first, then insert
        const { data: existing } = await supabase
          .from('translation')
          .select('id')
          .eq('phrase_id', id as string)
          .eq('language_id', langCode)
          .single()

        if (existing) {
          await supabase.from('translation').update(translationData).eq('id', existing.id)
        } else {
          await supabase.from('translation').insert(translationData)
        }
      }

      const { data: updated } = await supabase.from('phrase').select('*').eq('id', id as string).single()
      return res.status(200).json({ data: updated })
    }

    if (req.method === 'DELETE') {
      // Delete translations first, then phrase
      await supabase.from('translation').delete().eq('phrase_id', id as string)
      const { error } = await supabase.from('phrase').delete().eq('id', id as string)
      if (error) throw new Error(error.message)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
