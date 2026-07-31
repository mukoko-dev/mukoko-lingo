import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { phrases } from '../../_lib/mongo'
import { mergeTranslations, toApiPhrase } from '../../../lib/db/phrase-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    await requireAdmin(req)

    const col = await phrases()

    if (req.method === 'PUT') {
      const existing = await col.findOne({ _id: id as string })
      if (!existing) return res.status(404).json({ error: 'Phrase not found' })

      const update: Record<string, any> = { updatedAt: new Date() }
      if (req.body.category !== undefined) update.category = req.body.category
      if (req.body.difficulty !== undefined) update.difficulty = req.body.difficulty
      if (req.body.cefrLevel !== undefined) update.cefrLevel = req.body.cefrLevel
      update.translations = mergeTranslations(existing.translations, req.body || {})

      const updated = await col.findOneAndUpdate(
        { _id: id as string },
        { $set: update },
        { returnDocument: 'after' }
      )
      if (!updated) return res.status(404).json({ error: 'Phrase not found' })
      return res.status(200).json({ data: toApiPhrase(updated) })
    }

    if (req.method === 'DELETE') {
      await col.deleteOne({ _id: id as string })
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
