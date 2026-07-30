import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const col = await skills()
    const docs = await col.find({ is_active: true }).sort({ sort_order: 1 }).toArray()

    const data = docs.map((s: any) => ({ ...s, id: String(s._id), skill_levels: s.levels || [] }))
    return res.status(200).json({ data })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
