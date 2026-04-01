import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { supabaseIdentity } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const { data: person, error } = await supabaseIdentity
        .from('person')
        .select('*')
        .eq('id', user.personId)
        .single()

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: person })
    }

    if (req.method === 'PUT') {
      const update: Record<string, any> = {}
      if (req.body.display_name !== undefined) update.display_name = req.body.display_name
      if (req.body.preferred_ui_language) update.preferred_ui_language = req.body.preferred_ui_language
      if (req.body.learning_goal !== undefined) update.learning_goal = req.body.learning_goal
      if (req.body.daily_goal !== undefined) update.daily_goal = req.body.daily_goal

      const { data: person, error } = await supabaseIdentity
        .from('person')
        .update(update)
        .eq('id', user.personId)
        .select()
        .single()

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: person })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
