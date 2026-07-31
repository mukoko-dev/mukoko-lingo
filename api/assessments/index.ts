import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { assessments, skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { skill_id, type } = req.query

    const filter: Record<string, any> = { is_active: true }
    if (skill_id) filter.skill_id = skill_id
    if (type) filter.type = type

    const col = await assessments()
    const docs = await col.find(filter).sort({ created_at: -1 }).toArray()

    const skillsCol = await skills()
    const skillIds = docs.map((a: any) => a.skill_id).filter(ObjectId.isValid)
    const skillDocs = await skillsCol.find({ _id: { $in: skillIds.map((id: string) => new ObjectId(id)) } } as any).toArray()
    const skillById = new Map(skillDocs.map((s: any) => [String(s._id), { ...s, id: String(s._id) }]))

    const data = docs.map((a: any) => ({ ...a, id: String(a._id), skill: skillById.get(a.skill_id) || null }))
    return res.status(200).json({ data })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
