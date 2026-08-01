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
    const { category, difficulty, tag, scenario_id } = req.query

    const filter: Record<string, any> = { isActive: true }
    if (category) filter.category = category
    if (difficulty) filter.difficulty = difficulty
    if (tag) filter.tags = tag
    if (scenario_id) filter.scenarioIds = scenario_id

    const col = await phrases()
    const docs = await col.find(filter).sort({ createdAt: -1 }).limit(200).toArray()

    const data = toApiPhrases(docs)
    return res.status(200).json({ data, count: data.length })
  } catch (error: any) {
    log.error('Failed to fetch phrases', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
