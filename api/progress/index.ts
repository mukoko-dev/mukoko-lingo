import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { phraseProgress, phrases } from '../_lib/mongo'
import { toApiPhrase } from '../../lib/db/phrase-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const col = await phraseProgress()

    if (req.method === 'GET') {
      const rows = await col.find({ user_id: user.personId }).sort({ updated_at: -1 }).toArray()

      const phraseIds = rows.map((r: any) => r.phrase_id).filter(Boolean)
      const phrasesCol = await phrases()
      const phraseDocs = await phrasesCol.find({ _id: { $in: phraseIds } }).toArray()
      const phraseById = new Map(phraseDocs.map((p) => [p._id, toApiPhrase(p)]))

      const data = rows.map((r: any) => ({
        ...r,
        id: String(r._id),
        phrase: phraseById.get(r.phrase_id) || null,
      }))

      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      const { phrase_id, status } = req.body || {}
      if (!phrase_id || !status) {
        return res.status(400).json({ error: 'phrase_id and status are required' })
      }

      const now = new Date()
      const result = await col.findOneAndUpdate(
        { user_id: user.personId, phrase_id },
        {
          $set: { status, last_practiced_at: now, updated_at: now },
          $inc: { times_practiced: 1 },
          $setOnInsert: { user_id: user.personId, phrase_id, created_at: now },
        },
        { upsert: true, returnDocument: 'after' }
      )

      return res.status(200).json({ data: { ...result, id: String(result!._id) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
