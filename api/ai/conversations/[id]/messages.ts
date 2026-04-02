import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../../_lib/cors'
import { requireAuth } from '../../../_lib/auth-middleware'
import supabase from '../../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Verify conversation ownership
    const { data: conversation } = await supabase
      .from('ai_conversation')
      .select('id')
      .eq('id', id as string)
      .eq('user_id', user.personId)
      .single()

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (req.method === 'GET') {
      const { data: messages, error } = await supabase
        .from('ai_message')
        .select('*')
        .eq('conversation_id', id as string)
        .order('created_at', { ascending: true })

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: messages })
    }

    if (req.method === 'POST') {
      const { role, content, scylladb_message_id } = req.body || {}
      if (!role || !content) {
        return res.status(400).json({ error: 'role and content are required' })
      }

      const { data: message, error } = await supabase
        .from('ai_message')
        .insert({
          conversation_id: id as string,
          role,
          content,
          scylladb_message_id: scylladb_message_id || null,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)

      // Update conversation timestamp
      await supabase
        .from('ai_conversation')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', id as string)

      return res.status(201).json({ data: message })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
