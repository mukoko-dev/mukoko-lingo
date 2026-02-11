import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    await requireAdmin(req)

    const data: any = {}
    if (req.body.display_name !== undefined) data.displayName = req.body.display_name
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.icon !== undefined) data.icon = req.body.icon
    if (req.body.sort_order !== undefined) data.sortOrder = req.body.sort_order
    if (req.body.is_active !== undefined) data.isActive = req.body.is_active

    const skill = await prisma.skill.update({
      where: { id: id as string },
      data,
    })

    return res.status(200).json({ data: skill })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
