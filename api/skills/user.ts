import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { userSkills, skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)

    const userSkillsCol = await userSkills()
    const rows = await userSkillsCol.find({ user_id: user.personId }).toArray()

    // Skill `_id`s are UUID strings, not ObjectIds — the previous
    // ObjectId.isValid() filter dropped every real id, so `skill` always
    // came back null.
    const skillsCol = await skills()
    const skillIds = rows.map((r: any) => r.skill_id).filter(Boolean)
    const skillDocs = skillIds.length ? await skillsCol.find({ _id: { $in: skillIds } }).toArray() : []
    const skillById = new Map(skillDocs.map((s: any) => [String(s._id), { ...s, id: String(s._id) }]))

    const data = rows.map((r: any) => ({ ...r, id: String(r._id), skill: skillById.get(r.skill_id) || null }))
    return res.status(200).json({ data })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
