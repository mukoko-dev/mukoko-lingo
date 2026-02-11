import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { category, difficulty, skill_id } = req.query

    const where: any = {}
    if (category) where.category = category as string
    if (difficulty) where.difficulty = difficulty as string
    if (skill_id) where.skillId = skill_id as string

    const phrases = await prisma.phrase.findMany({
      where,
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    return res.status(200).json({ data: phrases, count: phrases.length })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
