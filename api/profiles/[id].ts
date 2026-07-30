import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { profiles } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Profile not found' })
    const col = await profiles()

    if (req.method === 'GET') {
      const user = await requireAuth(req)
      if (user.personId !== id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }
      const person = await col.findOne({ _id: new ObjectId(id as string) } as any)
      if (!person) return res.status(404).json({ error: 'Profile not found' })
      return res.status(200).json({ data: { ...person, id: String(person._id) } })
    }

    if (req.method === 'PUT') {
      const user = await requireAuth(req)
      if (user.personId !== id && user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden' })
      }

      const update: Record<string, any> = {}
      if (req.body.display_name !== undefined) update.display_name = req.body.display_name
      if (req.body.preferred_ui_language) update.preferred_ui_language = req.body.preferred_ui_language
      if (req.body.learning_goal !== undefined) update.learning_goal = req.body.learning_goal
      if (req.body.daily_goal !== undefined) update.daily_goal = req.body.daily_goal

      const person = await col.findOneAndUpdate(
        { _id: new ObjectId(id as string) } as any,
        { $set: update },
        { returnDocument: 'after' }
      )
      if (!person) return res.status(404).json({ error: 'Profile not found' })
      return res.status(200).json({ data: { ...person, id: String(person._id) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
