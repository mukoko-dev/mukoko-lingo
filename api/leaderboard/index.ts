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
import supabase from '../_lib/supabase'
import { supabaseIdentity } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)

  try {
    // Get current user if authenticated (to highlight their position)
    const user = await authenticateRequest(req)

    // Get study sessions from the last 7 days
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString()

    const { data: sessions, error } = await supabase
      .from('study_session')
      .select('person_id, phrases_studied, time_spent_minutes')
      .gte('created_at', weekAgoStr)

    if (error) {
      console.error('[mukoko][leaderboard] Query failed:', error.message)
      return res.status(500).json({ error: 'Failed to load leaderboard' })
    }

    // Aggregate by person
    const aggregated: Record<string, { phrases: number; minutes: number }> = {}
    for (const s of sessions || []) {
      if (!s.person_id) continue
      if (!aggregated[s.person_id]) {
        aggregated[s.person_id] = { phrases: 0, minutes: 0 }
      }
      aggregated[s.person_id].phrases += s.phrases_studied || 0
      aggregated[s.person_id].minutes += s.time_spent_minutes || 0
    }

    // Calculate XP: 10 per phrase + 2 per minute studied
    const rankings = Object.entries(aggregated)
      .map(([personId, stats]) => ({
        personId,
        weeklyXP: stats.phrases * 10 + stats.minutes * 2,
        phrasesStudied: stats.phrases,
        minutesStudied: stats.minutes,
      }))
      .sort((a, b) => b.weeklyXP - a.weeklyXP)
      .slice(0, limit)

    // Get display names for the top users
    const personIds = rankings.map(r => r.personId)
    const { data: people } = personIds.length > 0
      ? await supabaseIdentity
          .from('person')
          .select('id, display_name')
          .in('id', personIds)
      : { data: [] }

    const nameMap: Record<string, string> = {}
    for (const p of people || []) {
      nameMap[p.id] = p.display_name || 'Learner'
    }

    const leaderboard = rankings.map((r, index) => ({
      rank: index + 1,
      displayName: nameMap[r.personId] || 'Learner',
      weeklyXP: r.weeklyXP,
      phrasesStudied: r.phrasesStudied,
      isCurrentUser: user ? r.personId === user.personId : false,
    }))

    // Find current user's rank if not in top N
    let currentUserRank = null
    if (user && !leaderboard.some(l => l.isCurrentUser)) {
      const allRankings = Object.entries(aggregated)
        .map(([personId, stats]) => ({
          personId,
          weeklyXP: stats.phrases * 10 + stats.minutes * 2,
        }))
        .sort((a, b) => b.weeklyXP - a.weeklyXP)

      const userIdx = allRankings.findIndex(r => r.personId === user.personId)
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
      totalParticipants: Object.keys(aggregated).length,
    })
  } catch (error: any) {
    console.error('[mukoko][leaderboard] Error:', error.message)
    return res.status(500).json({ error: 'Failed to load leaderboard' })
  }
}
