import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { assignments, classMemberships } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const assignmentsCol = await assignments()
    const membershipsCol = await classMemberships()

    if (req.method === 'GET') {
      const { class_id } = req.query
      if (!class_id) return res.status(400).json({ error: 'class_id is required' })

      const membership = await membershipsCol.findOne({ class_id: class_id as string, person_id: user.personId })
      if (!membership) return res.status(403).json({ error: 'Not a member of this class' })

      const docs = await assignmentsCol.find({ class_id: class_id as string }).sort({ due_date: 1 }).toArray()
      return res.status(200).json({ data: docs.map((a: any) => ({ ...a, id: String(a._id) })) })
    }

    if (req.method === 'POST') {
      const { class_id, title, description, phrase_ids, due_date } = req.body || {}
      if (!class_id || !title) {
        return res.status(400).json({ error: 'class_id and title are required' })
      }

      const membership = await membershipsCol.findOne({ class_id, person_id: user.personId })
      if (!membership || membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can create assignments' })
      }

      const now = new Date()
      const doc = {
        class_id,
        title,
        description: description || null,
        phrase_ids: phrase_ids || [],
        due_date: due_date || null,
        created_by: user.personId,
        status: 'active',
        created_at: now,
      }

      const result = await assignmentsCol.insertOne(doc as any)
      return res.status(201).json({ data: { ...doc, id: String(result.insertedId) } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
