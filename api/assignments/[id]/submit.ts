import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Get assignment and verify student membership
    const { data: assignment } = await supabase
      .from('assignment')
      .select('class_id')
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

    const { answers, score, time_taken } = req.body || {}

    // Upsert submission (allow resubmission)
    const { data: existing } = await supabase
      .from('assignment_submission')
      .select('id')
      .eq('assignment_id', id as string)
      .eq('person_id', user.personId)
      .single()

    let result
    if (existing) {
      const { data, error } = await supabase
        .from('assignment_submission')
        .update({
          answers: answers || null,
          score: score ?? null,
          time_taken: time_taken ?? null,
          submitted_at: new Date().toISOString(),
          status: 'submitted',
        })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw new Error(error.message)
      result = data
    } else {
      const { data, error } = await supabase
        .from('assignment_submission')
        .insert({
          assignment_id: id as string,
          person_id: user.personId,
          answers: answers || null,
          score: score ?? null,
          time_taken: time_taken ?? null,
          status: 'submitted',
        })
        .select()
        .single()
      if (error) throw new Error(error.message)
      result = data
    }

    return res.status(201).json({ data: result })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
