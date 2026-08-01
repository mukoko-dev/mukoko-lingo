import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import { phraseEngagementLive, phrases } from '../_lib/mongo'
import { toApiPhrase } from '../../lib/db/phrase-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const engagementCol = await phraseEngagementLive()
    const phrasesCol = await phrases()

    // phraseEngagementLive is a live Mongo view (bookmarks + phrase_views
    // grouped by phrase_id) — no stored counters to keep in sync.
    const top20 = await engagementCol
      .find({})
      .sort({ viewCount: -1 })
      .limit(20)
      .toArray()

    const phraseIds = top20.map((v) => v.phraseId).filter(Boolean)
    const phraseDocs = await phrasesCol.find({ _id: { $in: phraseIds } }).toArray()
    const phraseById = new Map(phraseDocs.map((p) => [p._id, p]))

    const results = top20
      .filter((v) => phraseById.has(v.phraseId))
      .map((v) => ({
        ...toApiPhrase(phraseById.get(v.phraseId)!),
        view_count: v.viewCount,
        bookmark_count: v.bookmarkCount,
      }))

    return res.status(200).json({ data: results })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
