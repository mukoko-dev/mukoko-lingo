import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { phraseId } = req.query

  try {
    const user = await requireAuth(req)

    const { data: progress } = await supabase
      .from('phrase_progress')
      .select('bookmarked')
      .eq('user_id', user.personId)
      .eq('phrase_id', phraseId as string)
      .single()

    return res.status(200).json({ data: { bookmarked: !!progress?.bookmarked } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
