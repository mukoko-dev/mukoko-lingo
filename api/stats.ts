/**
 * Public Content Stats Endpoint
 *
 * Returns aggregate counts (phrases, categories, languages) from the live
 * Supabase database without requiring authentication. Used by the landing
 * page to show real database counts instead of bundled static data.
 *
 * Runs server-side so it can use SUPABASE_URL / SUPABASE_SECRET_KEY
 * — no EXPO_PUBLIC_ build-time env vars needed on the client.
 *
 * Cached at the CDN edge for 5 minutes to minimise DB load.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from './_lib/cors'
import supabase from './_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Cache at the CDN edge: fresh for 5 min, stale-while-revalidate for 1 hr
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')

  try {
    const [phraseResult, categoryResult, languageResult] = await Promise.all([
      supabase.from('phrase').select('*', { count: 'exact', head: true }),
      supabase.from('phrase').select('category'),
      supabase.from('translation').select('language_id'),
    ])

    const totalPhrases = phraseResult.count ?? 0

    const categorySet = new Set<string>()
    for (const row of (categoryResult.data ?? []) as Array<{ category: string | null }>) {
      if (row.category) categorySet.add(row.category)
    }

    const languageSet = new Set<string>()
    for (const row of (languageResult.data ?? []) as Array<{ language_id: string | null }>) {
      if (row.language_id) languageSet.add(row.language_id)
    }

    return res.status(200).json({
      total_phrases: totalPhrases,
      total_categories: categorySet.size,
      total_languages: languageSet.size,
    })
  } catch (error: any) {
    // Return 500 so the client falls through to its next strategy
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
