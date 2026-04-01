import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { supabaseSystem } from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)

    const update: Record<string, any> = {}
    if (req.body.name !== undefined) update.name = req.body.name
    if (req.body.description !== undefined) update.description = req.body.description
    if (req.body.category !== undefined) update.category = req.body.category
    if (req.body.rule_type !== undefined) update.rule_type = req.body.rule_type
    if (req.body.patterns !== undefined) update.patterns = req.body.patterns
    if (req.body.keywords !== undefined) update.keywords = req.body.keywords
    if (req.body.ai_instructions !== undefined) update.ai_instructions = req.body.ai_instructions
    if (req.body.is_active !== undefined) update.is_active = req.body.is_active
    if (req.body.severity !== undefined) update.severity = req.body.severity

    const { data: guardrail, error } = await supabaseSystem
      .from('guardrail')
      .update(update)
      .eq('id', id as string)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: guardrail })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
