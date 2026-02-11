import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)
    const { assessment_id, skill_id, answers, score, passed, time_taken } = req.body || {}

    if (!assessment_id || !skill_id || !answers || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Store assessment result
    const userAssessment = await prisma.userAssessment.create({
      data: {
        userId: user.profileId,
        assessmentId: assessment_id,
        skillId: skill_id,
        answers,
        score,
        passed: !!passed,
        timeTaken: time_taken,
      },
    })

    // Update user skill if passed
    if (passed) {
      const assessment = await prisma.assessment.findUnique({
        where: { id: assessment_id },
      })

      if (assessment) {
        await prisma.userSkill.upsert({
          where: {
            userId_skillId: { userId: user.profileId, skillId: skill_id },
          },
          create: {
            userId: user.profileId,
            skillId: skill_id,
            currentLevel: assessment.targetLevel,
            currentScore: score,
            levelAchievedAt: new Date(),
          },
          update: {
            currentScore: Math.max(score),
            ...(score >= 70 && { currentLevel: assessment.targetLevel }),
            levelAchievedAt: new Date(),
          },
        })
      }
    }

    return res.status(201).json({ data: userAssessment })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
