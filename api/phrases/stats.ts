/**
 * Phrase Stats API — returns aggregate counts for the phrase library.
 * Used by the welcome/landing page to show real dynamic counts.
 *
 * GET /api/phrases/stats
 * Returns: { total_phrases, total_categories, total_languages }
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { createLogger } from '../_lib/logger'
import { phrases } from '../_lib/mongo'

const log = createLogger('phrase-stats')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const col = await phrases()

    const [totalPhrases, categories, languageTags] = await Promise.all([
      col.countDocuments({ isActive: true }),
      col.distinct('category', { isActive: true }),
      col.distinct('translations.languageTag', { isActive: true }),
    ])

    return res.status(200).json({
      total_phrases: totalPhrases,
      total_categories: categories.filter(Boolean).length,
      total_languages: languageTags.filter(Boolean).length,
    })
  } catch (error: any) {
    log.error('Failed to fetch phrase stats', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
