import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { moderationAlerts } from '../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const admin = await requireAdmin(req)
    // `moderation_alerts._id` is a UUID string (see recordModerationAlert in
    // api/_lib/moderation.ts), so an ObjectId guard here 404s every alert and
    // the admin queue's Approve/Reject buttons never work.
    if (typeof id !== 'string' || !id) return res.status(404).json({ error: 'Alert not found' })

    const { status, admin_notes } = req.body || {}
    if (!status) return res.status(400).json({ error: 'status is required' })

    const update: Record<string, any> = { status }
    if (admin_notes !== undefined) update.admin_notes = admin_notes

    if (status === 'reviewed') {
      update.reviewed_by = admin.personId
      update.reviewed_at = new Date()
    } else if (status === 'resolved') {
      update.resolved_by = admin.personId
    }

    const col = await moderationAlerts()
    const alert = await col.findOneAndUpdate(
      { _id: id } as any,
      { $set: update },
      { returnDocument: 'after' }
    )

    if (!alert) return res.status(404).json({ error: 'Alert not found' })
    return res.status(200).json({ data: { ...alert, id: String(alert._id) } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
