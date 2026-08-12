import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { learningStandards } from '../../_lib/mongo'
import { toApiStandard, toStandardUpdate } from '../../../lib/db/standard-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)
    // `_id` is a UUID string on these documents, not an ObjectId — the old
    // ObjectId.isValid() guard rejected every real standard as 404.
    if (typeof id !== 'string' || !id) return res.status(404).json({ error: 'Standard not found' })

    const update = toStandardUpdate(req.body ?? {})
    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: 'No updatable fields provided' })
    }

    const col = await learningStandards()
    const standard = await col.findOneAndUpdate(
      { _id: id },
      { $set: { ...update, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!standard) return res.status(404).json({ error: 'Standard not found' })
    return res.status(200).json({ data: toApiStandard(standard) })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
