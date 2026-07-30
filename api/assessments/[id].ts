import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { assessments, skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    if (!ObjectId.isValid(id as string)) return res.status(404).json({ error: 'Assessment not found' })

    const col = await assessments()
    const assessment = await col.findOne({ _id: new ObjectId(id as string) } as any)
    if (!assessment) return res.status(404).json({ error: 'Assessment not found' })

    let skill = null
    if (assessment.skill_id && ObjectId.isValid(assessment.skill_id)) {
      const skillsCol = await skills()
      const skillDoc = await skillsCol.findOne({ _id: new ObjectId(assessment.skill_id) } as any)
      if (skillDoc) skill = { ...skillDoc, id: String(skillDoc._id) }
    }

    return res.status(200).json({ data: { ...assessment, id: String(assessment._id), skill } })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
