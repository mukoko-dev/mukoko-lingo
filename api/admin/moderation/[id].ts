import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'PUT') return res.status(405).json({ error: 'Method not allowed' })

  const { id } = req.query

  try {
    const admin = await requireAdmin(req)

    const { status, admin_notes } = req.body || {}
    if (!status) return res.status(400).json({ error: 'status is required' })

    const data: any = { status }
    if (admin_notes !== undefined) data.adminNotes = admin_notes

    if (status === 'reviewed') {
      data.reviewedBy = admin.profileId
      data.reviewedAt = new Date()
    } else if (status === 'resolved') {
      data.resolvedBy = admin.profileId
    }

    const alert = await prisma.moderationAlert.update({
      where: { id: id as string },
      data,
    })

    return res.status(200).json({ data: alert })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
