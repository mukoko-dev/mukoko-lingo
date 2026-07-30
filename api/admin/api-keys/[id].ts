import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { apiKeys } from '../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'API key not found' })

    const col = await apiKeys()
    const key = await col.findOne({ _id: new ObjectId(id as string) } as any)

    if (!key) return res.status(404).json({ error: 'API key not found' })
    if (key.created_by !== user.personId && user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    if (req.method === 'PUT') {
      const update: Record<string, any> = {}
      if (req.body.name !== undefined) update.name = req.body.name
      if (req.body.scopes !== undefined) update.scopes = req.body.scopes
      if (req.body.is_active !== undefined) update.is_active = req.body.is_active

      const updated = await col.findOneAndUpdate(
        { _id: new ObjectId(id as string) } as any,
        { $set: update },
        { returnDocument: 'after' }
      )

      return res.status(200).json({ data: { ...updated, id: String(updated!._id) } })
    }

    if (req.method === 'DELETE') {
      await col.updateOne({ _id: new ObjectId(id as string) } as any, { $set: { is_active: false } })
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
