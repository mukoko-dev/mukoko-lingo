import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { phrases } from '../../_lib/mongo'
import { toApiPhrase } from '../../../lib/db/phrase-shape'

const LANGUAGE_FIELDS = ['english', 'shona', 'ndebele', 'swahili', 'chinese']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    await requireAdmin(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Phrase not found' })

    const col = await phrases()

    if (req.method === 'PUT') {
      const update: Record<string, any> = {}
      if (req.body.category !== undefined) update.category = req.body.category
      if (req.body.content_type !== undefined) update.content_type = req.body.content_type
      if (req.body.difficulty !== undefined) update.difficulty = req.body.difficulty
      if (req.body.skill_id !== undefined) update.skill_id = req.body.skill_id
      if (req.body.required_proficiency !== undefined) update.required_proficiency = req.body.required_proficiency

      for (const lang of LANGUAGE_FIELDS) {
        if (req.body[lang] !== undefined) update[lang] = req.body[lang]
        if (req.body[`${lang}Pronunciation`] !== undefined) update[`pronunciation.${lang}`] = req.body[`${lang}Pronunciation`]
      }
      if (req.body.englishContext !== undefined) update['context.en'] = req.body.englishContext
      if (req.body.shonaContext !== undefined) update['context.sn'] = req.body.shonaContext
      if (req.body.ndebeleContext !== undefined) update['context.nd'] = req.body.ndebeleContext
      if (req.body.swahiliContext !== undefined) update['context.sw'] = req.body.swahiliContext
      if (req.body.chineseContext !== undefined) update['context.zh'] = req.body.chineseContext

      const updated = await col.findOneAndUpdate(
        { _id: new ObjectId(id as string) } as any,
        { $set: update },
        { returnDocument: 'after' }
      )
      if (!updated) return res.status(404).json({ error: 'Phrase not found' })
      return res.status(200).json({ data: toApiPhrase(updated as any) })
    }

    if (req.method === 'DELETE') {
      await col.deleteOne({ _id: new ObjectId(id as string) } as any)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
