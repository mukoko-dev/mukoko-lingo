/**
 * Community Leaderboard API
 *
 * Returns the top learners by XP for the current week.
 * Ubuntu philosophy: community learning, shared progress.
 *
 * GET /api/leaderboard?period=weekly&limit=20
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { authenticateRequest } from '../_lib/auth-middleware'
import { studySessions } from '../_lib/mongo'
import { getDisplayNames } from '../../lib/db/identity'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

  try {
    // Get current user if authenticated (to highlight their position)
    const user = await authenticateRequest(req)

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)

    const col = await studySessions()
    const aggregated = await col
      .aggregate([
        { $match: { created_at: { $gte: weekAgo } } },
        {
          $group: {
            _id: '$user_id',
            phrases: { $sum: '$phrases_studied' },
            minutes: { $sum: '$time_spent_minutes' },
          },
        },
      ])
      .toArray()

    // Calculate XP: 10 per phrase + 2 per minute studied
    const allRankings = aggregated
      .map((a: any) => ({
        personId: a._id,
        weeklyXP: (a.phrases || 0) * 10 + (a.minutes || 0) * 2,
        phrasesStudied: a.phrases || 0,
      }))
      .sort((a, b) => b.weeklyXP - a.weeklyXP)

    const rankings = allRankings.slice(0, limit)

    // Get display names for the top users
    const personIds = rankings.map((r) => r.personId)
    const nameMap = await getDisplayNames(personIds)

    const leaderboard = rankings.map((r, index) => ({
      rank: index + 1,
      displayName: nameMap[r.personId] || 'Learner',
      weeklyXP: r.weeklyXP,
      phrasesStudied: r.phrasesStudied,
      isCurrentUser: user ? r.personId === user.personId : false,
    }))

    // Find current user's rank if not in top N
    let currentUserRank = null
    if (user && !leaderboard.some((l) => l.isCurrentUser)) {
      const userIdx = allRankings.findIndex((r) => r.personId === user.personId)
      if (userIdx >= 0) {
        currentUserRank = {
          rank: userIdx + 1,
          weeklyXP: allRankings[userIdx].weeklyXP,
        }
      }
    }

    return res.status(200).json({
      leaderboard,
      currentUserRank,
      period: 'weekly',
      totalParticipants: allRankings.length,
    })
  } catch (error: any) {
    console.error('[mukoko][leaderboard] Error:', error.message)
    return res.status(500).json({ error: 'Failed to load leaderboard' })
  }
}
