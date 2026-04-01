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
    if (req.body.display_name !== undefined) update.display_name = req.body.display_name
    if (req.body.description !== undefined) update.description = req.body.description
    if (req.body.icon !== undefined) update.icon = req.body.icon
    if (req.body.sort_order !== undefined) update.sort_order = req.body.sort_order
    if (req.body.is_active !== undefined) update.is_active = req.body.is_active

    const { data: skill, error } = await supabase
      .from('skill')
      .update(update)
      .eq('id', id as string)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: skill })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
