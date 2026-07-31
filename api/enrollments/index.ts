import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth, requireAdmin } from '../_lib/auth-middleware'
import { organizationEnrollments } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const col = await organizationEnrollments()

    if (req.method === 'GET') {
      const user = await requireAuth(req)
      const { organization_id } = req.query

      const filter: Record<string, any> = {}
      if (organization_id) filter.organization_id = organization_id
      if (user.role !== 'admin') filter.enrolled_by = user.personId

      const enrollments = await col.find(filter).sort({ enrolled_at: -1 }).toArray()
      return res.status(200).json({ data: enrollments.map((e: any) => ({ ...e, id: String(e._id) })) })
    }

    if (req.method === 'POST') {
      const user = await requireAdmin(req)

      const { organization_id, plan, seat_count } = req.body || {}
      if (!organization_id) {
        return res.status(400).json({ error: 'organization_id is required' })
      }

      const doc = {
        organization_id,
        plan: plan || 'free',
        seat_count: seat_count || null,
        enrolled_by: user.personId,
        status: 'active',
        enrolled_at: new Date(),
      }

      const result = await col.insertOne(doc as any)
      return res.status(201).json({ data: { ...doc, id: String(result.insertedId) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
