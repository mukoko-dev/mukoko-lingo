/**
 * XP Sync API
 *
 * GET  /api/xp          - Get user's XP state + level info
 * POST /api/xp          - Record XP events (sync from local)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { userXp, xpEvents } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const xpCol = await userXp()
    const eventsCol = await xpEvents()

    if (req.method === 'GET') {
      const xpState = await xpCol.findOneAndUpdate(
        { user_id: user.personId },
        { $setOnInsert: { user_id: user.personId, total_xp: 0, level: 1, daily_goal_xp: 50 } },
        { upsert: true, returnDocument: 'after' }
      )

      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const weekAgoStr = weekAgo.toISOString().split('T')[0]

      const [todayAgg, weekAgg] = await Promise.all([
        eventsCol
          .aggregate([
            { $match: { user_id: user.personId, event_date: today } },
            { $group: { _id: null, sum: { $sum: '$amount' } } },
          ])
          .toArray(),
        eventsCol
          .aggregate([
            { $match: { user_id: user.personId, event_date: { $gte: weekAgoStr } } },
            { $group: { _id: null, sum: { $sum: '$amount' } } },
          ])
          .toArray(),
      ])

      return res.status(200).json({
        totalXP: xpState?.total_xp || 0,
        level: xpState?.level || 1,
        dailyGoal: xpState?.daily_goal_xp || 50,
        todayXP: todayAgg[0]?.sum || 0,
        weeklyXP: weekAgg[0]?.sum || 0,
      })
    }

    if (req.method === 'POST') {
      const { events } = req.body || {}
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'events array is required' })
      }

      const insertData = events.map((event: any) => ({
        user_id: user.personId,
        source: event.source,
        amount: event.amount,
        event_date: event.timestamp ? event.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
        metadata: event.metadata || null,
        created_at: new Date(),
      }))

      if (insertData.length > 0) await eventsCol.insertMany(insertData)

      const totalAdded = events.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)

      const currentXP = await xpCol.findOne({ user_id: user.personId })
      const newTotal = (currentXP?.total_xp || 0) + totalAdded
      const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1

      await xpCol.findOneAndUpdate(
        { user_id: user.personId },
        { $set: { total_xp: newTotal, level: newLevel } },
        { upsert: true }
      )

      return res.status(200).json({ synced: events.length, totalXP: newTotal, level: newLevel })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    console.error('[mukoko][xp] Error:', error.message)
    return res.status(500).json({ error: 'Failed to process XP data' })
  }
}
