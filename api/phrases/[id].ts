import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { phrases, phraseViews } from '../_lib/mongo'
import { toApiPhrase } from '../../lib/db/phrase-shape'
import { authenticateRequest } from '../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const col = await phrases()
    const phrase = await col.findOne({ _id: id as string })

    if (!phrase) return res.status(404).json({ error: 'Phrase not found' })

    // Record a plain engagement signal (low-sensitivity, see Phase 4 of
    // docs/ECOSYSTEM_DATA_MIGRATION.md) — this is the one obviously-intended
    // write site for phrase views. Best-effort: a logging failure must never
    // break the phrase fetch itself.
    try {
      const user = await authenticateRequest(req)
      const viewsCol = await phraseViews()
      await viewsCol.insertOne({
        phrase_id: id as string,
        user_id: user?.personId,
        viewed_at: new Date(),
      })
    } catch {
      // best-effort only — view tracking is not critical path
    }

    return res.status(200).json({ data: toApiPhrase(phrase) })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
