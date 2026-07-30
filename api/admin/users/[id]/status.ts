import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../../../_lib/cors'
import { requireAdmin } from '../../../_lib/auth-middleware'
import { profiles } from '../../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Profile not found' })

    const { status } = req.body || {}
    if (!status || !['active', 'inactive', 'banned', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Valid status is required' })
    }

    const col = await profiles()
    const person = await col.findOneAndUpdate(
      { _id: new ObjectId(id as string) } as any,
      { $set: { status } },
      { returnDocument: 'after' }
    )

    if (!person) return res.status(404).json({ error: 'Profile not found' })
    return res.status(200).json({ data: { ...person, id: String(person._id) } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
