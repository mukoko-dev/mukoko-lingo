import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { createLogger } from '../_lib/logger'
import { phrases } from '../_lib/mongo'
import { toApiPhrases } from '../../lib/db/phrase-shape'

const log = createLogger('phrases')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { category, difficulty, content_type, skill_id } = req.query

    const filter: Record<string, any> = {}
    if (category) filter.category = category
    if (difficulty) filter.difficulty = difficulty
    if (content_type) filter.content_type = content_type
    if (skill_id) filter.skill_id = skill_id

    const col = await phrases()
    const docs = await col.find(filter).sort({ created_at: -1 }).limit(200).toArray()

    const data = toApiPhrases(docs as any)
    return res.status(200).json({ data, count: data.length })
  } catch (error: any) {
    log.error('Failed to fetch phrases', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
