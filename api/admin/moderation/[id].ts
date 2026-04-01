import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const admin = await requireAdmin(req)

    const { status, admin_notes } = req.body || {}
    if (!status) return res.status(400).json({ error: 'status is required' })

    const update: Record<string, any> = { status }
    if (admin_notes !== undefined) update.admin_notes = admin_notes

    if (status === 'reviewed') {
      update.reviewed_by = admin.personId
      update.reviewed_at = new Date().toISOString()
    } else if (status === 'resolved') {
      update.resolved_by = admin.personId
    }

    const { data: alert, error } = await supabase
      .from('moderation_alert')
      .update(update)
      .eq('id', id as string)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: alert })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
