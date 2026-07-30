import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { assignments, classMemberships, assignmentSubmissions } from '../../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const user = await requireAuth(req)
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Assignment not found' })

    const assignmentsCol = await assignments()
    const assignment = await assignmentsCol.findOne({ _id: new ObjectId(id as string) } as any)
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' })

    const membershipsCol = await classMemberships()
    const membership = await membershipsCol.findOne({ class_id: assignment.class_id, person_id: user.personId })
    if (!membership) return res.status(403).json({ error: 'Not a member of this class' })

    const { answers, score, time_taken } = req.body || {}

    const submissionsCol = await assignmentSubmissions()
    const now = new Date()
    const result = await submissionsCol.findOneAndUpdate(
      { assignment_id: id as string, person_id: user.personId },
      {
        $set: {
          answers: answers || null,
          score: score ?? null,
          time_taken: time_taken ?? null,
          submitted_at: now,
          status: 'submitted',
        },
        $setOnInsert: { assignment_id: id as string, person_id: user.personId },
      },
      { upsert: true, returnDocument: 'after' }
    )

    return res.status(201).json({ data: { ...result, id: String(result!._id) } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
