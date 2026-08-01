import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../../_lib/cors'
import { requireAuth } from '../../../_lib/auth-middleware'
import { shamwariConversations, shamwariMessages } from '../../../_lib/mongo'
import { buildMessageDoc, toApiMessage, toApiMessages } from '../../../../lib/db/conversation-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    const conversationsCol = await shamwariConversations()
    const conversation = await conversationsCol.findOne({ _id: id as string, ownerPersonId: user.personId })

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    const messagesCol = await shamwariMessages()

    if (req.method === 'GET') {
      const messages = await messagesCol
        .find({ conversationId: conversation._id })
        .sort({ sequence: 1 })
        .toArray()

      return res.status(200).json({ data: toApiMessages(messages) })
    }

    if (req.method === 'POST') {
      const { role, content } = req.body || {}
      if (!role || !content) {
        return res.status(400).json({ error: 'role and content are required' })
      }

      const now = new Date()
      const message = buildMessageDoc({
        conversationId: conversation._id,
        role,
        content,
        sequence: conversation.messageCount,
      })

      await messagesCol.insertOne(message as any)
      await conversationsCol.updateOne(
        { _id: conversation._id },
        { $inc: { messageCount: 1 }, $set: { lastMessageAt: now, updatedAt: now } } as any
      )

      return res.status(201).json({ data: toApiMessage(message) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
