import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { data: skills, error } = await supabase
      .from('skill')
      .select('*, skill_levels:skill_level(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) throw new Error(error.message)
    return res.status(200).json({ data: skills })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
