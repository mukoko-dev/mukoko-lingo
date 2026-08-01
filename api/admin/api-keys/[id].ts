import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { platformApiKeys } from '../../_lib/mongo'
import { toApiKeySummary } from '../../../lib/db/api-key-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    if (typeof id !== 'string' || !id) return res.status(404).json({ error: 'API key not found' })

    const col = await platformApiKeys()
    const key = await col.findOne({ _id: id })

    if (!key) return res.status(404).json({ error: 'API key not found' })
    if (key.createdByPersonId !== user.personId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'PUT') {
      const update: Record<string, any> = { updatedAt: new Date() }
      if (req.body.name !== undefined) update.name = req.body.name
      if (req.body.scopes !== undefined) update.scopes = req.body.scopes
      if (req.body.is_active !== undefined) update.isActive = req.body.is_active

      const updated = await col.findOneAndUpdate(
        { _id: id },
        { $set: update },
        { returnDocument: 'after' }
      )

      return res.status(200).json({ data: toApiKeySummary(updated!) })
    }

    if (req.method === 'DELETE') {
      await col.updateOne(
        { _id: id },
        { $set: { isActive: false, revokedAt: new Date(), updatedAt: new Date() } }
      )
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
