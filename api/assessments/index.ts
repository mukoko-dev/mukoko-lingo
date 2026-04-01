import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { skill_id, type } = req.query

    let query = supabase
      .from('assessment')
      .select('*, skill(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (skill_id) query = query.eq('skill_id', skill_id as string)
    if (type) query = query.eq('type', type as string)

    const { data: assessments, error } = await query

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: assessments })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
