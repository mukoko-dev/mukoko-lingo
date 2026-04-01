import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)

    const update: Record<string, any> = {}
    if (req.body.title !== undefined) update.title = req.body.title
    if (req.body.description !== undefined) update.description = req.body.description
    if (req.body.criteria !== undefined) update.criteria = req.body.criteria
    if (req.body.vocabulary_range !== undefined) update.vocabulary_range = req.body.vocabulary_range
    if (req.body.conversation_types !== undefined) update.conversation_types = req.body.conversation_types
    if (req.body.grammar_concepts !== undefined) update.grammar_concepts = req.body.grammar_concepts
    if (req.body.ai_prompt_template !== undefined) update.ai_prompt_template = req.body.ai_prompt_template
    if (req.body.example_phrases !== undefined) update.example_phrases = req.body.example_phrases
    if (req.body.is_active !== undefined) update.is_active = req.body.is_active

    const { data: standard, error } = await supabase
      .from('learning_standard')
      .update(update)
      .eq('id', id as string)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: standard })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
