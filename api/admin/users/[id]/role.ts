import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../../_lib/cors'
import { requireAdmin } from '../../../_lib/auth-middleware'
import { supabaseIdentity } from '../../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)

    const { role } = req.body || {}
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required (user or admin)' })
    }

    const { data: person, error } = await supabaseIdentity
      .from('person')
      .update({ role })
      .eq('id', id as string)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: person })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
