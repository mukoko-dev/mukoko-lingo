/**
 * XP Sync API
 *
 * GET  /api/xp          - Get user's XP state + level info
 * POST /api/xp          - Record XP events (sync from local)
 * GET  /api/xp/history  - Get recent XP event history
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
      // Get or create XP state
      let { data: xpState } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.personId)
        .single()

      if (!xpState) {
        const { data: created } = await supabase
          .from('user_xp')
          .insert({ user_id: user.personId })
          .select('*')
          .single()
        xpState = created
      }

      // Get today's XP
      const today = new Date().toISOString().split('T')[0]
      const { data: todayEvents } = await supabase
        .from('xp_event')
        .select('amount')
        .eq('user_id', user.personId)
        .eq('event_date', today)

      const todayXP = (todayEvents || []).reduce((sum: number, e: any) => sum + e.amount, 0)

      // Get this week's XP
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: weekEvents } = await supabase
        .from('xp_event')
        .select('amount')
        .eq('user_id', user.personId)
        .gte('event_date', weekAgo.toISOString().split('T')[0])

      const weeklyXP = (weekEvents || []).reduce((sum: number, e: any) => sum + e.amount, 0)

      return res.status(200).json({
        totalXP: xpState?.total_xp || 0,
        level: xpState?.level || 1,
        dailyGoal: xpState?.daily_goal_xp || 50,
        todayXP,
        weeklyXP,
      })
    }

    if (req.method === 'POST') {
      const { events } = req.body || {}
      if (!Array.isArray(events)) {
        return res.status(400).json({ error: 'events array is required' })
      }

      // Insert XP events
      const insertData = events.map((event: any) => ({
        user_id: user.personId,
        source: event.source,
        amount: event.amount,
        event_date: event.timestamp ? event.timestamp.split('T')[0] : new Date().toISOString().split('T')[0],
        metadata: event.metadata || null,
      }))

      const { error: eventError } = await supabase
        .from('xp_event')
        .insert(insertData)

      if (eventError) throw eventError

      // Update aggregate XP
      const totalAdded = events.reduce((sum: number, e: any) => sum + (e.amount || 0), 0)
      const { data: currentXP } = await supabase
        .from('user_xp')
        .select('total_xp')
        .eq('user_id', user.personId)
        .single()

      const newTotal = (currentXP?.total_xp || 0) + totalAdded
      const newLevel = Math.floor(Math.sqrt(newTotal / 100)) + 1

      await supabase
        .from('user_xp')
        .upsert({
          user_id: user.personId,
          total_xp: newTotal,
          level: newLevel,
        }, { onConflict: 'user_id' })

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
