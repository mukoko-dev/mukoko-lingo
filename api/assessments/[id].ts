import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { findById } from '../_lib/doc-id'
import { assessments, skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    // `assessments._id` may be a UUID string like every other populated
    // lingo collection; the old ObjectId.isValid() guard 404'd those before
    // the query ran.
    const col = await assessments()
    const assessment = await findById<any>(col, id as string)
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' })

    let skill = null
    if (assessment.skill_id) {
      // `skills._id` is a UUID string, not an ObjectId. The old
      // ObjectId.isValid() guard was false for every real skill id, so this
      // join always resolved to null and the response never carried a skill.
      const skillsCol = await skills()
      const skillDoc = await skillsCol.findOne({ _id: assessment.skill_id } as any)
      if (skillDoc) skill = { ...skillDoc, id: String(skillDoc._id) }
    }

    return res.status(200).json({ data: { ...assessment, id: String(assessment._id), skill } })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
