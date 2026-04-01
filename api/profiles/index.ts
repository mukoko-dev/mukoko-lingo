import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import { supabaseIdentity } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const { role, status } = req.query

    let query = supabaseIdentity
      .from('person')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (role) query = query.eq('role', role as string)
    if (status) query = query.eq('status', status as string)

    const { data: persons, error } = await query

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: persons, count: (persons || []).length })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
