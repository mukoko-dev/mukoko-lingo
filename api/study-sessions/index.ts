import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { studySessions, profiles } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const col = await studySessions()

    if (req.method === 'GET') {
      const sessions = await col
        .find({ user_id: user.personId })
        .sort({ session_date: -1 })
        .limit(30)
        .toArray()

      return res.status(200).json({ data: sessions })
    }

    if (req.method === 'POST') {
      const { phrases_studied, time_spent_minutes } = req.body || {}

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todaySessionDate = today.toISOString().split('T')[0]

      const result = await col.findOneAndUpdate(
        { user_id: user.personId, session_date: todaySessionDate },
        {
          $inc: {
            phrases_studied: phrases_studied || 0,
            time_spent_minutes: time_spent_minutes || 0,
          },
          $setOnInsert: { user_id: user.personId, session_date: todaySessionDate, created_at: new Date() },
        },
        { upsert: true, returnDocument: 'after' }
      )

      const profilesCol = await profiles()
      await profilesCol.updateOne(
        { _id: new ObjectId(user.personId) } as any,
        { $set: { last_study_date: new Date().toISOString(), last_active: new Date() } }
      )

      return res.status(200).json({ data: { ...result, id: String(result!._id) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
