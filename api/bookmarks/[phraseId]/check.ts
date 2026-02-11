import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { phraseId } = req.query

  try {
    const user = await requireAuth(req)

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_phraseId: { userId: user.profileId, phraseId: phraseId as string },
      },
    })

    return res.status(200).json({ data: { bookmarked: !!bookmark } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
