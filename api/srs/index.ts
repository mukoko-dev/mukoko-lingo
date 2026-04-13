/**
 * SRS Sync API
 *
 * GET  /api/srs       - Get user's SRS cards
 * POST /api/srs       - Upsert SRS cards (sync from local)
 * GET  /api/srs?due=1 - Get count of due cards
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import supabase from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    if (req.method === 'GET') {
      if (req.query.due === '1') {
        // Return count of due cards
        const today = new Date().toISOString().split('T')[0]
        const { count } = await supabase
          .from('srs_card')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.personId)
          .lte('next_review_date', today)
          .gt('total_reviews', 0)

        return res.status(200).json({ dueCount: count || 0 })
      }

      // Return all SRS cards
      const { data, error } = await supabase
        .from('srs_card')
        .select('*')
        .eq('user_id', user.personId)
        .order('next_review_date', { ascending: true })

      if (error) throw error
      return res.status(200).json({ cards: data || [] })
    }

    if (req.method === 'POST') {
      const { cards } = req.body || {}
      if (!Array.isArray(cards)) {
        return res.status(400).json({ error: 'cards array is required' })
      }

      // Upsert cards (local state syncs to server)
      const upsertData = cards.map((card: any) => ({
        user_id: user.personId,
        phrase_id: card.phraseId,
        easiness_factor: card.easinessFactor,
        interval_days: card.interval,
        repetition_count: card.repetitions,
        next_review_date: card.nextReviewDate,
        last_review_date: card.lastReviewDate || null,
        last_quality: card.lastQuality || 0,
        total_reviews: card.totalReviews || 0,
      }))

      const { error } = await supabase
        .from('srs_card')
        .upsert(upsertData, { onConflict: 'user_id,phrase_id' })

      if (error) throw error
      return res.status(200).json({ synced: upsertData.length })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    console.error('[mukoko][srs] Error:', error.message)
    return res.status(500).json({ error: 'Failed to process SRS data' })
  }
}
