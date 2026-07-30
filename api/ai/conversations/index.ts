import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { aiConversations } from '../../_lib/mongo'
import { LANG_CODE_MAP } from '../../../lib/db/phrase-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const col = await aiConversations()

    if (req.method === 'GET') {
      const conversations = await col
        .find({ user_id: user.personId })
        .sort({ updated_at: -1 })
        .limit(50)
        .toArray()

      const data = conversations.map((c: any) => ({ ...c, id: String(c._id) }))
      return res.status(200).json({ data })
    }

    if (req.method === 'POST') {
      const { type, language, title, class_id } = req.body || {}
      if (!type || !language) {
        return res.status(400).json({ error: 'type and language are required' })
      }

      // Map language name to code if needed (e.g. 'english' → 'en')
      const langCode = LANG_CODE_MAP[language.toLowerCase()] || language

      const now = new Date()
      const insertResult = await col.insertOne({
        user_id: user.personId,
        type,
        language_id: langCode,
        title: title || `${type} - ${language}`,
        class_id: class_id || null,
        messages: [],
        updated_at: now,
        created_at: now,
      } as any)

      return res.status(201).json({
        data: {
          id: String(insertResult.insertedId),
          user_id: user.personId,
          type,
          language_id: langCode,
          title: title || `${type} - ${language}`,
          class_id: class_id || null,
          messages: [],
          updated_at: now,
          created_at: now,
        },
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
