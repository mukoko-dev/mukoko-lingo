import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const conversations = await prisma.aiConversation.findMany({
        where: { userId: user.profileId },
        orderBy: { updatedAt: 'desc' },
        take: 50,
      })
      return res.status(200).json({ data: conversations })
    }

    if (req.method === 'POST') {
      const { type, language, title } = req.body || {}
      if (!type || !language) {
        return res.status(400).json({ error: 'type and language are required' })
      }

      const conversation = await prisma.aiConversation.create({
        data: {
          userId: user.profileId,
          type,
          language,
          title: title || `${type} - ${language}`,
        },
      })
      return res.status(201).json({ data: conversation })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
