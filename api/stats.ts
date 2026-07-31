/**
 * Public Content Stats Endpoint
 *
 * Returns aggregate counts (phrases, categories, languages) from the live
 * database without requiring authentication. Used by the landing page to
 * show real database counts instead of bundled static data.
 *
 * Cached at the CDN edge for 5 minutes to minimise DB load.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from './_lib/cors'
import { phrases } from './_lib/mongo'

const LANGUAGE_FIELDS = ['english', 'shona', 'ndebele', 'swahili', 'chinese']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Cache at the CDN edge: fresh for 5 min, stale-while-revalidate for 1 hr
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')

  try {
    const col = await phrases()

    const [totalPhrases, categories] = await Promise.all([col.countDocuments(), col.distinct('category')])

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
    // Return 500 so the client falls through to its next strategy
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
