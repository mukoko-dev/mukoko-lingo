import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'
import { supabaseIdentity } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const { data: sessions, error } = await supabase
        .from('study_session')
        .select('*')
        .eq('user_id', user.personId)
        .order('session_date', { ascending: false })
        .limit(30)

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: sessions })
    }

    if (req.method === 'POST') {
      const { phrases_studied, time_spent_minutes } = req.body || {}

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayIso = today.toISOString()

      // Check for existing session today
      const { data: existing } = await supabase
        .from('study_session')
        .select('id, phrases_studied, time_spent_minutes')
        .eq('user_id', user.personId)
        .eq('session_date', todayIso)
        .single()

      let result
      if (existing) {
        const { data, error } = await supabase
          .from('study_session')
          .update({
            phrases_studied: existing.phrases_studied + (phrases_studied || 0),
            time_spent_minutes: existing.time_spent_minutes + (time_spent_minutes || 0),
          })
          .eq('id', existing.id)
          .select()
          .single()
        if (error) throw new Error(error.message)
        result = data
      } else {
        const { data, error } = await supabase
          .from('study_session')
          .insert({
            user_id: user.personId,
            session_date: todayIso,
            phrases_studied: phrases_studied || 0,
            time_spent_minutes: time_spent_minutes || 0,
          })
          .select()
          .single()
        if (error) throw new Error(error.message)
        result = data
      }

      // Update last study date on identity.person
      await supabaseIdentity
        .from('person')
        .update({
          last_study_date: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })
        .eq('id', user.personId)

      return res.status(200).json({ data: result })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
