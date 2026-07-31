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

const LANGUAGE_FIELDS = ['english', 'shona', 'ndebele', 'swahili', 'chinese']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const col = await phrases()

    const [totalPhrases, categories] = await Promise.all([
      col.countDocuments(),
      col.distinct('category'),
    ])

    // Count how many of the known language fields actually have real content
    const languageCounts = await Promise.all(
      LANGUAGE_FIELDS.map((field) => col.countDocuments({ [field]: { $exists: true, $ne: '' } }))
    )
    const totalLanguages = languageCounts.filter((count) => count > 0).length

    return res.status(200).json({
      total_phrases: totalPhrases,
      total_categories: categories.filter(Boolean).length,
      total_languages: totalLanguages,
    })
  } catch (error: any) {
    log.error('Failed to fetch phrase stats', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
