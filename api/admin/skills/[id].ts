import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { skills } from '../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Skill not found' })

    const update: Record<string, any> = {}
    if (req.body.display_name !== undefined) update.display_name = req.body.display_name
    if (req.body.description !== undefined) update.description = req.body.description
    if (req.body.icon !== undefined) update.icon = req.body.icon
    if (req.body.sort_order !== undefined) update.sort_order = req.body.sort_order
    if (req.body.is_active !== undefined) update.is_active = req.body.is_active

    const col = await skills()
    const skill = await col.findOneAndUpdate(
      { _id: new ObjectId(id as string) } as any,
      { $set: update },
      { returnDocument: 'after' }
    )

    if (!skill) return res.status(404).json({ error: 'Skill not found' })
    return res.status(200).json({ data: { ...skill, id: String(skill._id) } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
