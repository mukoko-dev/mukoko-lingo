import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { moderationAlerts } from '../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const { status } = req.query
    const filter: Record<string, any> = {}
    if (status) filter.status = status

    const col = await moderationAlerts()
    const alerts = await col.find(filter).sort({ created_at: -1 }).limit(100).toArray()

    return res.status(200).json({ data: alerts.map((a: any) => ({ ...a, id: String(a._id) })) })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
