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
    if (req.body.title !== undefined) data.title = req.body.title
    if (req.body.description !== undefined) data.description = req.body.description
    if (req.body.criteria !== undefined) data.criteria = req.body.criteria
    if (req.body.vocabulary_range !== undefined) data.vocabularyRange = req.body.vocabulary_range
    if (req.body.conversation_types !== undefined) data.conversationTypes = req.body.conversation_types
    if (req.body.grammar_concepts !== undefined) data.grammarConcepts = req.body.grammar_concepts
    if (req.body.ai_prompt_template !== undefined) data.aiPromptTemplate = req.body.ai_prompt_template
    if (req.body.example_phrases !== undefined) data.examplePhrases = req.body.example_phrases
    if (req.body.is_active !== undefined) data.isActive = req.body.is_active

    const standard = await prisma.learningStandard.update({
      where: { id: id as string },
      data,
    })

    return res.status(200).json({ data: standard })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
