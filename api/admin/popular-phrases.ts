import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import { phraseViews, bookmarks, phrases } from '../_lib/mongo'
import { toApiPhrase } from '../../lib/db/phrase-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const viewsCol = await phraseViews()
    const bookmarksCol = await bookmarks()
    const phrasesCol = await phrases()

    const [viewCounts, bookmarkCounts] = await Promise.all([
      viewsCol.aggregate([{ $group: { _id: '$phrase_id', count: { $sum: 1 } } }]).toArray(),
      bookmarksCol.aggregate([{ $group: { _id: '$phrase_id', count: { $sum: 1 } } }]).toArray(),
    ])

    const bookmarkCountById = new Map(bookmarkCounts.map((b: any) => [b._id, b.count]))
    const top20 = viewCounts
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 20)

    const phraseIds = top20.map((v: any) => v._id).filter(Boolean)
    const phraseDocs = await phrasesCol.find({ _id: { $in: phraseIds } }).toArray()
    const phraseById = new Map(phraseDocs.map((p) => [p._id, p]))

    const results = top20
      .filter((v: any) => phraseById.has(v._id))
      .map((v: any) => ({
        ...toApiPhrase(phraseById.get(v._id)!),
        view_count: v.count,
        bookmark_count: bookmarkCountById.get(v._id) || 0,
      }))

    return res.status(200).json({ data: results })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
