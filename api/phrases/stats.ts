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
import supabase from '../_lib/supabase'

const log = createLogger('phrase-stats')

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const [phraseResult, categoryResult, languageResult] = await Promise.all([
      supabase.from('phrase').select('id', { count: 'exact', head: true }),
      supabase.from('phrase').select('category').limit(10000),
      supabase.from('translation').select('language_id').limit(10000),
    ])

    if (phraseResult.error) throw new Error(phraseResult.error.message)

    const totalPhrases = phraseResult.count || 0

    const categorySet = new Set<string>()
    for (const row of categoryResult.data || []) {
      if (row.category) categorySet.add(row.category)
    }

    const languageSet = new Set<string>()
    for (const row of languageResult.data || []) {
      if (row.language_id) languageSet.add(row.language_id)
    }

    return res.status(200).json({
      total_phrases: totalPhrases,
      total_categories: categorySet.size,
      total_languages: languageSet.size,
    })
  } catch (error: any) {
    log.error('Failed to fetch phrase stats', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
