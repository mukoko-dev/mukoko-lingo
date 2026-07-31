import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { sharedGuardrails } from '../../_lib/mongo'

const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const col = await sharedGuardrails()
    // Platform-wide guardrails (appliesTo empty) plus any scoped to this surface.
    const docs = await col
      .find({ $or: [{ appliesTo: { $size: 0 } }, { appliesTo: 'mukoko-lingo' }] })
      .toArray()
    docs.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])

    return res.status(200).json({ data: docs.map((g) => ({ ...g, id: g._id })) })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
