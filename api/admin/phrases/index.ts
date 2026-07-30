import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { phrases } from '../../_lib/mongo'
import { buildPhraseLanguageFields, toApiPhrase } from '../../../lib/db/phrase-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const { category, difficulty, skill_id, required_proficiency, content_type } = req.body || {}
    const { english, shona, ndebele, chinese } = req.body || {}

    if (!english || !shona || !ndebele || !chinese) {
      return res.status(400).json({ error: 'All language translations are required' })
    }

    const col = await phrases()
    const doc = {
      category: category || 'general',
      content_type: content_type || 'phrase',
      difficulty: difficulty || 'beginner',
      skill_id: skill_id || null,
      required_proficiency: required_proficiency || null,
      created_at: new Date(),
      ...buildPhraseLanguageFields(req.body || {}),
    }

    const result = await col.insertOne(doc as any)
    return res.status(201).json({ data: toApiPhrase({ ...doc, _id: result.insertedId } as any) })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
