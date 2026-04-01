import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { phraseId } = req.query

  try {
    const user = await requireAuth(req)

    if (req.method === 'DELETE') {
      // Set bookmarked=false on phrase_progress
      const { error } = await supabase
        .from('phrase_progress')
        .update({ bookmarked: false })
        .eq('user_id', user.personId)
        .eq('phrase_id', phraseId as string)

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
