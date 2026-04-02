import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Verify membership
    const { data: membership } = await supabase
      .from('class_membership')
      .select('role')
      .eq('class_id', id as string)
      .eq('person_id', user.personId)
      .single()

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this class' })
    }

    if (req.method === 'GET') {
      const { data: classData, error } = await supabase
        .from('class')
        .select(`
          *,
          members:class_membership(person_id, role, joined_at),
          assignments:assignment(id, title, due_date, status, created_at)
        `)
        .eq('id', id as string)
        .single()

      if (error || !classData) return res.status(404).json({ error: 'Class not found' })
      return res.status(200).json({ data: { ...classData, my_role: membership.role } })
    }

    if (req.method === 'PUT') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can update class details' })
      }

      const update: Record<string, any> = {}
      if (req.body.name !== undefined) update.name = req.body.name
      if (req.body.description !== undefined) update.description = req.body.description
      if (req.body.language_id !== undefined) update.language_id = req.body.language_id
      if (req.body.status !== undefined) update.status = req.body.status

      const { data: updated, error } = await supabase
        .from('class')
        .update(update)
        .eq('id', id as string)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: updated })
    }

    if (req.method === 'DELETE') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can delete a class' })
      }

      const { error } = await supabase.from('class').delete().eq('id', id as string)
      if (error) throw new Error(error.message)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
