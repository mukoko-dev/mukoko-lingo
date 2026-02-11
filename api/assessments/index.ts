import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { skill_id, type } = req.query

    const where: any = { isActive: true }
    if (skill_id) where.skillId = skill_id as string
    if (type) where.type = type as string

    const assessments = await prisma.assessment.findMany({
      where,
      include: { skill: true },
      orderBy: { createdAt: 'desc' },
    })
    return res.status(200).json({ data: assessments })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
