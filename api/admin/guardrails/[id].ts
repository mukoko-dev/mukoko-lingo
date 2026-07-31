import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { sharedGuardrails } from '../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)

    const col = await sharedGuardrails()
    const existing = await col.findOne({ _id: id as string })
    if (!existing) return res.status(404).json({ error: 'Guardrail not found' })

    // Core guardrails are platform-wide (shamwari.guardrails) and cannot be
    // disabled by an individual app — only non-core, app-scoped guardrails
    // are editable here.
    if (existing.isCore) {
      return res.status(403).json({
        error: 'This guardrail is a core platform policy and cannot be edited from Lingo.',
      })
    }

    if (req.body.isEnabled === undefined) {
      return res.status(400).json({ error: 'isEnabled is required' })
    }

    const guardrail = await col.findOneAndUpdate(
      { _id: id as string },
      { $set: { isEnabled: req.body.isEnabled, updatedAt: new Date() } },
      { returnDocument: 'after' }
    )

    if (!guardrail) return res.status(404).json({ error: 'Guardrail not found' })
    return res.status(200).json({ data: { ...guardrail, id: guardrail._id } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
