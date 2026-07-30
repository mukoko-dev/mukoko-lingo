import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { classMemberships } from '../../_lib/mongo'
import { findPersonIdByEmail } from '../../../lib/db/identity'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    const col = await classMemberships()

    const myMembership = await col.findOne({ class_id: id as string, person_id: user.personId })
    if (!myMembership) {
      return res.status(403).json({ error: 'Not a member of this class' })
    }

    if (req.method === 'GET') {
      const members = await col.find({ class_id: id as string }).sort({ joined_at: 1 }).toArray()
      return res.status(200).json({ data: members.map((m: any) => ({ ...m, id: String(m._id) })) })
    }

    if (req.method === 'POST') {
      if (myMembership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can add members' })
      }

      const { person_id, email, role } = req.body || {}
      const memberRole = role || 'student'

      let resolvedPersonId = person_id
      if (!resolvedPersonId && email) {
        resolvedPersonId = await findPersonIdByEmail(email)
        if (!resolvedPersonId) return res.status(404).json({ error: 'User not found' })
      }

      if (!resolvedPersonId) {
        return res.status(400).json({ error: 'person_id or email is required' })
      }

      const now = new Date()
      const result = await col.insertOne({
        class_id: id as string,
        person_id: resolvedPersonId,
        role: memberRole,
        joined_at: now,
      } as any)

      return res.status(201).json({
        data: { id: String(result.insertedId), class_id: id, person_id: resolvedPersonId, role: memberRole, joined_at: now },
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
