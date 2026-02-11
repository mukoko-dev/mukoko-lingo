import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const levels = await prisma.skillLevel.findMany({
      include: { skill: true },
      orderBy: [{ skill: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    })
    return res.status(200).json({ data: levels })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
