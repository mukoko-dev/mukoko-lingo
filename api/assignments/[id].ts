import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Get assignment and verify class membership
    const { data: assignment } = await supabase
      .from('assignment')
      .select('*, class_id')
      .eq('id', id as string)
      .single()

    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    const { data: membership } = await supabase
      .from('class_membership')
      .select('role')
      .eq('class_id', assignment.class_id)
      .eq('person_id', user.personId)
      .single()

    if (!membership) return res.status(403).json({ error: 'Not a member of this class' })

    if (req.method === 'GET') {
      // Include submissions if teacher
      let query = supabase
        .from('assignment')
        .select('*')
        .eq('id', id as string)
        .single()

      const { data, error } = await query
      if (error) throw new Error(error.message)

      // If teacher, include all submissions; if student, include only own
      let submissionQuery = supabase
        .from('assignment_submission')
        .select('*')
        .eq('assignment_id', id as string)

      if (membership.role !== 'teacher') {
        submissionQuery = submissionQuery.eq('person_id', user.personId)
      }

      const { data: submissions } = await submissionQuery

      return res.status(200).json({ data: { ...data, submissions: submissions || [] } })
    }

    if (req.method === 'PUT') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can update assignments' })
      }

      const update: Record<string, any> = {}
      if (req.body.title !== undefined) update.title = req.body.title
      if (req.body.description !== undefined) update.description = req.body.description
      if (req.body.phrase_ids !== undefined) update.phrase_ids = req.body.phrase_ids
      if (req.body.due_date !== undefined) update.due_date = req.body.due_date
      if (req.body.status !== undefined) update.status = req.body.status

      const { data: updated, error } = await supabase
        .from('assignment')
        .update(update)
        .eq('id', id as string)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: updated })
    }

    if (req.method === 'DELETE') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can delete assignments' })
      }

      const { error } = await supabase.from('assignment').delete().eq('id', id as string)
      if (error) throw new Error(error.message)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
