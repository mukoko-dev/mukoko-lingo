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
import { srsCards } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const col = await srsCards()

    if (req.method === 'GET') {
      if (req.query.due === '1') {
        const today = new Date().toISOString().split('T')[0]
        const dueCount = await col.countDocuments({
          user_id: user.personId,
          next_review_date: { $lte: today },
          total_reviews: { $gt: 0 },
        })

        return res.status(200).json({ dueCount })
      }

      const data = await col.find({ user_id: user.personId }).sort({ next_review_date: 1 }).toArray()
      return res.status(200).json({ cards: data })
    }

    if (req.method === 'POST') {
      const { cards } = req.body || {}
      if (!Array.isArray(cards)) {
        return res.status(400).json({ error: 'cards array is required' })
      }

      const ops = cards.map((card: any) => ({
        updateOne: {
          filter: { user_id: user.personId, phrase_id: card.phraseId },
          update: {
            $set: {
              user_id: user.personId,
              phrase_id: card.phraseId,
              easiness_factor: card.easinessFactor,
              interval_days: card.interval,
              repetition_count: card.repetitions,
              next_review_date: card.nextReviewDate,
              last_review_date: card.lastReviewDate || null,
              last_quality: card.lastQuality || 0,
              total_reviews: card.totalReviews || 0,
            },
          },
          upsert: true,
        },
      }))

      if (ops.length > 0) await col.bulkWrite(ops)
      return res.status(200).json({ synced: ops.length })
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
