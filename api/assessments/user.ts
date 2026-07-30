import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { userAssessments, assessments, skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)

    const col = await userAssessments()
    const rows = await col.find({ user_id: user.personId }).sort({ completed_at: -1 }).toArray()

    const assessmentsCol = await assessments()
    const skillsCol = await skills()
    const assessmentIds = rows.map((r: any) => r.assessment_id).filter(ObjectId.isValid)
    const assessmentDocs = await assessmentsCol.find({ _id: { $in: assessmentIds.map((id: string) => new ObjectId(id)) } } as any).toArray()
    const skillIds = assessmentDocs.map((a: any) => a.skill_id).filter(ObjectId.isValid)
    const skillDocs = await skillsCol.find({ _id: { $in: skillIds.map((id: string) => new ObjectId(id)) } } as any).toArray()
    const skillById = new Map(skillDocs.map((s: any) => [String(s._id), { ...s, id: String(s._id) }]))
    const assessmentById = new Map(
      assessmentDocs.map((a: any) => [String(a._id), { ...a, id: String(a._id), skill: skillById.get(a.skill_id) || null }])
    )

    const data = rows.map((r: any) => ({
      ...r,
      id: String(r._id),
      assessment: assessmentById.get(r.assessment_id) || null,
    }))

    return res.status(200).json({ data })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
