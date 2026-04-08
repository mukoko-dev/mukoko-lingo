import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'
import { supabaseIdentity } from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Verify membership
    const { data: myMembership } = await supabase
      .from('class_membership')
      .select('role')
      .eq('class_id', id as string)
      .eq('person_id', user.personId)
      .single()

    if (!myMembership) {
      return res.status(403).json({ error: 'Not a member of this class' })
    }

    if (req.method === 'GET') {
      const { data: members, error } = await supabase
        .from('class_membership')
        .select('*')
        .eq('class_id', id as string)
        .order('joined_at', { ascending: true })

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: members })
    }

    if (req.method === 'POST') {
      if (myMembership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can add members' })
      }

      const { person_id, email, role } = req.body || {}
      const memberRole = role || 'student'

      // Resolve person_id from email if not provided
      let resolvedPersonId = person_id
      if (!resolvedPersonId && email) {
        const { data: person } = await supabaseIdentity
          .from('person')
          .select('id')
          .eq('email', email)
          .single()
        if (!person) return res.status(404).json({ error: 'User not found' })
        resolvedPersonId = person.id
      }

      if (!resolvedPersonId) {
        return res.status(400).json({ error: 'person_id or email is required' })
      }

      const { data: membership, error } = await supabase
        .from('class_membership')
        .insert({
          class_id: id as string,
          person_id: resolvedPersonId,
          role: memberRole,
        })
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(201).json({ data: membership })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
