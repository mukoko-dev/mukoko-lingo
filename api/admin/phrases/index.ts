import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const {
      category, english, shona, ndebele, chinese,
      english_pronunciation, shona_pronunciation, ndebele_pronunciation, chinese_pronunciation,
      english_context, shona_context, ndebele_context, chinese_context,
      difficulty, skill_id, required_proficiency,
    } = req.body || {}

    if (!english || !shona || !ndebele || !chinese) {
      return res.status(400).json({ error: 'All language translations are required' })
    }

    const phrase = await prisma.phrase.create({
      data: {
        category: category || 'general',
        english,
        shona,
        ndebele,
        chinese,
        englishPronunciation: english_pronunciation,
        shonaPronunciation: shona_pronunciation,
        ndebelePronunciation: ndebele_pronunciation,
        chinesePronunciation: chinese_pronunciation,
        englishContext: english_context,
        shonaContext: shona_context,
        ndebeleContext: ndebele_context,
        chineseContext: chinese_context,
        difficulty: difficulty || 'beginner',
        skillId: skill_id,
        requiredProficiency: required_proficiency,
      },
    })

    return res.status(201).json({ data: phrase })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
