import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      const bookmarks = await prisma.bookmark.findMany({
        where: { userId: user.profileId },
        include: { phrase: true },
        orderBy: { createdAt: 'desc' },
      })
      return res.status(200).json({ data: bookmarks })
    }

    if (req.method === 'POST') {
      const { phrase_id } = req.body || {}
      if (!phrase_id) return res.status(400).json({ error: 'phrase_id is required' })

      const bookmark = await prisma.bookmark.upsert({
        where: {
          userId_phraseId: { userId: user.profileId, phraseId: phrase_id },
        },
        create: { userId: user.profileId, phraseId: phrase_id },
        update: {},
      })
      return res.status(201).json({ data: bookmark })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
