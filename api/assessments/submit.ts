import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)
    const { assessment_id, skill_id, answers, score, passed, time_taken } = req.body || {}

    if (!assessment_id || !skill_id || !answers || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Store assessment result
    const { data: userAssessment, error } = await supabase
      .from('user_assessment')
      .insert({
        user_id: user.personId,
        assessment_id,
        skill_id,
        answers,
        score,
        passed: !!passed,
        time_taken: time_taken || null,
      })
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Update user skill if passed
    if (passed) {
      const { data: assessment } = await supabase
        .from('assessment')
        .select('target_level')
        .eq('id', assessment_id)
        .single()

      if (assessment) {
        // Check for existing user_skill
        const { data: existing } = await supabase
          .from('user_skill')
          .select('id, current_score')
          .eq('user_id', user.personId)
          .eq('skill_id', skill_id)
          .single()

        if (existing) {
          const update: Record<string, any> = {
            current_score: Math.max(existing.current_score, score),
            level_achieved_at: new Date().toISOString(),
          }
          if (score >= 70) update.current_level = assessment.target_level
          await supabase.from('user_skill').update(update).eq('id', existing.id)
        } else {
          await supabase.from('user_skill').insert({
            user_id: user.personId,
            skill_id,
            current_level: assessment.target_level,
            current_score: score,
            level_achieved_at: new Date().toISOString(),
          })
        }
      }
    }

    return res.status(201).json({ data: userAssessment })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
