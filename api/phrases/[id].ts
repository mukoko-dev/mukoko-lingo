import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const phrase = await prisma.phrase.findUnique({
      where: { id: id as string },
      include: { skill: true },
    })

    if (!phrase) return res.status(404).json({ error: 'Phrase not found' })
    return res.status(200).json({ data: phrase })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
