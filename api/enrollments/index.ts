import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth, requireAdmin } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    if (req.method === 'GET') {
      const user = await requireAuth(req)
      const { organization_id } = req.query

      let query = supabase
        .from('organization_enrollment')
        .select('*')

      if (organization_id) {
        query = query.eq('organization_id', organization_id as string)
      }

      // Non-admins can only see their own organization's enrollments
      if (user.role !== 'admin') {
        query = query.eq('enrolled_by', user.personId)
      }

      const { data: enrollments, error } = await query
        .order('enrolled_at', { ascending: false })

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: enrollments })
    }

    if (req.method === 'POST') {
      const user = await requireAdmin(req)

      const { organization_id, plan, seat_count } = req.body || {}
      if (!organization_id) {
        return res.status(400).json({ error: 'organization_id is required' })
      }

      const { data: enrollment, error } = await supabase
        .from('organization_enrollment')
        .insert({
          organization_id,
          plan: plan || 'free',
          seat_count: seat_count || null,
          enrolled_by: user.personId,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(201).json({ data: enrollment })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
