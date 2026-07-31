import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { skills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const col = await skills()
    const docs = await col.find({}).toArray()

    const levels = docs
      .flatMap((s: any) =>
        (s.levels || []).map((level: any) => ({
          ...level,
          skill: { ...s, id: String(s._id) },
        }))
      )
      .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))

    return res.status(200).json({ data: levels })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
