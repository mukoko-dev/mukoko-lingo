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
    if (req.body.name !== undefined) data.name = req.body.name
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.category !== undefined) data.category = req.body.category
    if (req.body.rule_type !== undefined) data.ruleType = req.body.rule_type
    if (req.body.patterns !== undefined) data.patterns = req.body.patterns
    if (req.body.keywords !== undefined) data.keywords = req.body.keywords
    if (req.body.ai_instructions !== undefined) data.aiInstructions = req.body.ai_instructions
    if (req.body.is_active !== undefined) data.isActive = req.body.is_active
    if (req.body.severity !== undefined) data.severity = req.body.severity

    const guardrail = await prisma.guardrail.update({
      where: { id: id as string },
      data,
    })

    return res.status(200).json({ data: guardrail })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
