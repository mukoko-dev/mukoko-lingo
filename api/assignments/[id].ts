import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { assignments, classMemberships, assignmentSubmissions } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Assignment not found' })

    const assignmentsCol = await assignments()
    const membershipsCol = await classMemberships()

    const assignment = await assignmentsCol.findOne({ _id: new ObjectId(id as string) } as any)
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    const membership = await membershipsCol.findOne({ class_id: assignment.class_id, person_id: user.personId })
    if (!membership) return res.status(403).json({ error: 'Not a member of this class' })

    if (req.method === 'GET') {
      const submissionsCol = await assignmentSubmissions()
      const filter: Record<string, any> = { assignment_id: id as string }
      if (membership.role !== 'teacher') filter.person_id = user.personId

      const submissions = await submissionsCol.find(filter).toArray()

      return res.status(200).json({
        data: {
          ...assignment,
          id: String(assignment._id),
          submissions: submissions.map((s: any) => ({ ...s, id: String(s._id) })),
        },
      })
    }

    if (req.method === 'PUT') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can update assignments' })
      }

      const update: Record<string, any> = {}
      if (req.body.title !== undefined) update.title = req.body.title
      if (req.body.description !== undefined) update.description = req.body.description
      if (req.body.phrase_ids !== undefined) update.phrase_ids = req.body.phrase_ids
      if (req.body.due_date !== undefined) update.due_date = req.body.due_date
      if (req.body.status !== undefined) update.status = req.body.status

      const updated = await assignmentsCol.findOneAndUpdate(
        { _id: new ObjectId(id as string) } as any,
        { $set: update },
        { returnDocument: 'after' }
      )

      if (!updated) return res.status(404).json({ error: 'Assignment not found' })
      return res.status(200).json({ data: { ...updated, id: String(updated._id) } })
    }

    if (req.method === 'DELETE') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can delete assignments' })
      }

      await assignmentsCol.deleteOne({ _id: new ObjectId(id as string) } as any)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
