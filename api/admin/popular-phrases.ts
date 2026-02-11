import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const daysBack = parseInt(req.query.days_back as string) || 30
    const since = new Date()
    since.setDate(since.getDate() - daysBack)

    // Get most viewed phrases
    const phraseViews = await prisma.phraseView.groupBy({
      by: ['phraseId'],
      _count: { phraseId: true },
      where: { viewedAt: { gte: since } },
      orderBy: { _count: { phraseId: 'desc' } },
      take: 20,
    })

    // Fetch phrase details
    const phraseIds = phraseViews.map(v => v.phraseId)
    const phrases = await prisma.phrase.findMany({
      where: { id: { in: phraseIds } },
    })

    const results = phraseViews.map(v => ({
      ...phrases.find(p => p.id === v.phraseId),
      view_count: v._count.phraseId,
    }))

    return res.status(200).json({ data: results })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
