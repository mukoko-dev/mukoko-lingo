import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    await requireAdmin(req)

    if (req.method === 'PUT') {
      const data: any = {}
      const fields: Record<string, string> = {
        category: 'category',
        english: 'english',
        shona: 'shona',
        ndebele: 'ndebele',
        chinese: 'chinese',
        english_pronunciation: 'englishPronunciation',
        shona_pronunciation: 'shonaPronunciation',
        ndebele_pronunciation: 'ndebelePronunciation',
        chinese_pronunciation: 'chinesePronunciation',
        english_context: 'englishContext',
        shona_context: 'shonaContext',
        ndebele_context: 'ndebeleContext',
        chinese_context: 'chineseContext',
        difficulty: 'difficulty',
        skill_id: 'skillId',
        required_proficiency: 'requiredProficiency',
      }

      for (const [bodyKey, prismaKey] of Object.entries(fields)) {
        if (req.body[bodyKey] !== undefined) {
          data[prismaKey] = req.body[bodyKey]
        }
      }

      const phrase = await prisma.phrase.update({
        where: { id: id as string },
        data,
      })
      return res.status(200).json({ data: phrase })
    }

    if (req.method === 'DELETE') {
      await prisma.phrase.delete({ where: { id: id as string } })
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
