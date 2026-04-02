import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'
import { LANG_CODE_MAP } from '../../../lib/db/transform-phrase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const { data: conversations, error } = await supabase
        .from('ai_conversation')
        .select('*')
        .eq('user_id', user.personId)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: conversations })
    }

    if (req.method === 'POST') {
      const { type, language, title, class_id, shamwari_conversation_id } = req.body || {}
      if (!type || !language) {
        return res.status(400).json({ error: 'type and language are required' })
      }

      // Map language name to code if needed (e.g. 'english' → 'en')
      const langCode = LANG_CODE_MAP[language.toLowerCase()] || language

      const { data: conversation, error } = await supabase
        .from('ai_conversation')
        .insert({
          user_id: user.personId,
          type,
          language_id: langCode,
          title: title || `${type} - ${language}`,
          class_id: class_id || null,
          shamwari_conversation_id: shamwari_conversation_id || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(201).json({ data: conversation })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
