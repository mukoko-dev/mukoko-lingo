import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Verify ownership
    const { data: key } = await supabase
      .from('api_key')
      .select('id, created_by')
      .eq('id', id as string)
      .single()

    if (!key) return res.status(404).json({ error: 'API key not found' })
    if (key.created_by !== user.personId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'PUT') {
      const update: Record<string, any> = {}
      if (req.body.name !== undefined) update.name = req.body.name
      if (req.body.scopes !== undefined) update.scopes = req.body.scopes
      if (req.body.is_active !== undefined) update.is_active = req.body.is_active

      const { data: updated, error } = await supabase
        .from('api_key')
        .update(update)
        .eq('id', id as string)
        .select('id, name, organization_id, key_prefix, scopes, is_active, created_at, expires_at')
        .single()

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: updated })
    }

    if (req.method === 'DELETE') {
      // Soft delete — set is_active to false
      const { error } = await supabase
        .from('api_key')
        .update({ is_active: false })
        .eq('id', id as string)

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
