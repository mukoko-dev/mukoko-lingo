import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { classes, classMemberships } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)
    const classesCol = await classes()
    const membershipsCol = await classMemberships()

    if (req.method === 'GET') {
      const { organization_id } = req.query

      const myMemberships = await membershipsCol.find({ person_id: user.personId }).toArray()
      const classIds = myMemberships.map((m: any) => m.class_id)

      const validIds = classIds.filter((cid: string) => ObjectId.isValid(cid)).map((cid: string) => new ObjectId(cid))
      const filter: Record<string, any> = { _id: { $in: validIds } }
      if (organization_id) filter.organization_id = organization_id

      const docs = await classesCol.find(filter as any).sort({ created_at: -1 }).toArray()

      return res.status(200).json({ data: docs.map((c: any) => ({ ...c, id: String(c._id) })) })
    }

    if (req.method === 'POST') {
      const { name, description, organization_id, language_id } = req.body || {}
      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' })
      }

      const now = new Date()
      const result = await classesCol.insertOne({
        name,
        description: description || null,
        organization_id,
        language_id: language_id || null,
        created_by: user.personId,
        status: 'active',
        created_at: now,
      } as any)

      // Auto-add creator as teacher
      await membershipsCol.insertOne({
        class_id: String(result.insertedId),
        person_id: user.personId,
        role: 'teacher',
        joined_at: now,
      } as any)

      return res.status(201).json({
        data: {
          id: String(result.insertedId),
          name,
          description: description || null,
          organization_id,
          language_id: language_id || null,
          created_by: user.personId,
          status: 'active',
          created_at: now,
        },
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
