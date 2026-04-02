import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const { class_id } = req.query
      if (!class_id) return res.status(400).json({ error: 'class_id is required' })

      // Verify class membership
      const { data: membership } = await supabase
        .from('class_membership')
        .select('role')
        .eq('class_id', class_id as string)
        .eq('person_id', user.personId)
        .single()

      if (!membership) return res.status(403).json({ error: 'Not a member of this class' })

      const { data: assignments, error } = await supabase
        .from('assignment')
        .select('*')
        .eq('class_id', class_id as string)
        .order('due_date', { ascending: true })

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: assignments })
    }

    if (req.method === 'POST') {
      const { class_id, title, description, phrase_ids, due_date } = req.body || {}
      if (!class_id || !title) {
        return res.status(400).json({ error: 'class_id and title are required' })
      }

      // Verify teacher role
      const { data: membership } = await supabase
        .from('class_membership')
        .select('role')
        .eq('class_id', class_id)
        .eq('person_id', user.personId)
        .single()

      if (!membership || membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can create assignments' })
      }

      const { data: assignment, error } = await supabase
        .from('assignment')
        .insert({
          class_id,
          title,
          description: description || null,
          phrase_ids: phrase_ids || [],
          due_date: due_date || null,
          created_by: user.personId,
          status: 'active',
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(201).json({ data: assignment })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
