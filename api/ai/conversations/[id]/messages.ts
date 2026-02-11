import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../../_lib/cors'
import { requireAuth } from '../../../_lib/auth-middleware'
import prisma from '../../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)

    // Verify conversation ownership
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: id as string, userId: user.profileId },
    })
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (req.method === 'GET') {
      const messages = await prisma.aiMessage.findMany({
        where: { conversationId: id as string },
        orderBy: { createdAt: 'asc' },
      })
      return res.status(200).json({ data: messages })
    }

    if (req.method === 'POST') {
      const { role, content } = req.body || {}
      if (!role || !content) {
        return res.status(400).json({ error: 'role and content are required' })
      }

      const message = await prisma.aiMessage.create({
        data: {
          conversationId: id as string,
          role,
          content,
        },
      })

      // Update conversation timestamp
      await prisma.aiConversation.update({
        where: { id: id as string },
        data: { updatedAt: new Date() },
      })

      return res.status(201).json({ data: message })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
