import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { classes, classMemberships, assignments } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Class not found' })

    const classesCol = await classes()
    const membershipsCol = await classMemberships()

    const membership = await membershipsCol.findOne({ class_id: id as string, person_id: user.personId })
    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this class' })
    }

    if (req.method === 'GET') {
      const classData = await classesCol.findOne({ _id: new ObjectId(id as string) } as any)
      if (!classData) return res.status(404).json({ error: 'Class not found' })

      const [members, assignmentsCol] = await Promise.all([
        membershipsCol.find({ class_id: id as string }).toArray(),
        assignments(),
      ])
      const classAssignments = await assignmentsCol
        .find({ class_id: id as string })
        .project({ title: 1, due_date: 1, status: 1, created_at: 1 })
        .toArray()

      return res.status(200).json({
        data: {
          ...classData,
          id: String(classData._id),
          members: members.map((m: any) => ({ ...m, id: String(m._id) })),
          assignments: classAssignments.map((a: any) => ({ ...a, id: String(a._id) })),
          my_role: membership.role,
        },
      })
    }

    if (req.method === 'PUT') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can update class details' })
      }

      const update: Record<string, any> = {}
      if (req.body.name !== undefined) update.name = req.body.name
      if (req.body.description !== undefined) update.description = req.body.description
      if (req.body.language_id !== undefined) update.language_id = req.body.language_id
      if (req.body.status !== undefined) update.status = req.body.status

      const updated = await classesCol.findOneAndUpdate(
        { _id: new ObjectId(id as string) } as any,
        { $set: update },
        { returnDocument: 'after' }
      )

      if (!updated) return res.status(404).json({ error: 'Class not found' })
      return res.status(200).json({ data: { ...updated, id: String(updated._id) } })
    }

    if (req.method === 'DELETE') {
      if (membership.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can delete a class' })
      }

      await classesCol.deleteOne({ _id: new ObjectId(id as string) } as any)
      return res.status(200).json({ data: { success: true } })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
