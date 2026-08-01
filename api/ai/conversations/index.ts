import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { shamwariConversations } from '../../_lib/mongo'
import { resolveOwnerEntityId } from '../../../lib/db/identity'
import { LANG_CODE_MAP } from '../../../lib/db/phrase-shape'
import { buildConversationDoc, toApiConversation, toApiConversations } from '../../../lib/db/conversation-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const col = await shamwariConversations()

    if (req.method === 'GET') {
      const conversations = await col
        .find({ ownerPersonId: user.personId })
        .sort({ updatedAt: -1 })
        .limit(50)
        .toArray()

      return res.status(200).json({ data: toApiConversations(conversations) })
    }

    if (req.method === 'POST') {
      const { type, language, title, class_id } = req.body || {}
      if (!type || !language) {
        return res.status(400).json({ error: 'type and language are required' })
      }

      // Map language name to code if needed (e.g. 'english' → 'en')
      const langCode = LANG_CODE_MAP[language.toLowerCase()] || language

      // shamwari.conversations requires an owning entity, not just a
      // person — most persons have no per-person "family" entity yet, so
      // this falls back to the Mukoko Lingo product entity.
      const ownerEntityId = await resolveOwnerEntityId(user.personId)

      const doc = buildConversationDoc({
        ownerPersonId: user.personId,
        ownerEntityId,
        type,
        languageId: langCode,
        title: title || `${type} - ${language}`,
        classId: class_id || null,
      })

      await col.insertOne(doc as any)

      return res.status(201).json({ data: toApiConversation(doc) })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
