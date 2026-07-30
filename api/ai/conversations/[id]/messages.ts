import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../../../_lib/cors'
import { requireAuth } from '../../../_lib/auth-middleware'
import { aiConversations } from '../../../_lib/mongo'

// Cap embedded messages per conversation to stay well under the 16MB BSON
// document limit — a tutoring chat session is naturally bounded anyway.
const MAX_MESSAGES = 200

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Conversation not found' })

    const col = await aiConversations()
    const conversation = await col.findOne({ _id: new ObjectId(id as string), user_id: user.personId } as any)

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (req.method === 'GET') {
      return res.status(200).json({ data: conversation.messages || [] })
    }

    if (req.method === 'POST') {
      const { role, content } = req.body || {}
      if (!role || !content) {
        return res.status(400).json({ error: 'role and content are required' })
      }

      const message = { role, content, created_at: new Date() }
      const now = new Date()

      await col.updateOne({ _id: new ObjectId(id as string) } as any, {
        $push: { messages: { $each: [message], $slice: -MAX_MESSAGES } },
        $set: { updated_at: now },
      } as any)

      return res.status(201).json({ data: message })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
