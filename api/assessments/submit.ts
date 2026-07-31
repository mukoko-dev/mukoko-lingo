import type { VercelRequest, VercelResponse } from '@vercel/node'
import { ObjectId } from 'mongodb'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { userAssessments, assessments, userSkills } from '../_lib/mongo'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const user = await requireAuth(req)
    const { assessment_id, skill_id, answers, score, passed, time_taken } = req.body || {}

    if (!assessment_id || !skill_id || !answers || score === undefined) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const userAssessmentsCol = await userAssessments()
    const now = new Date()
    const insertResult = await userAssessmentsCol.insertOne({
      user_id: user.personId,
      assessment_id,
      skill_id,
      answers,
      score,
      passed: !!passed,
      time_taken: time_taken || null,
      completed_at: now,
    } as any)

    if (passed) {
      const assessmentsCol = await assessments()
      const assessment = ObjectId.isValid(assessment_id)
        ? await assessmentsCol.findOne({ _id: new ObjectId(assessment_id) } as any)
        : null

      if (assessment) {
        const userSkillsCol = await userSkills()
        const existing = await userSkillsCol.findOne({ user_id: user.personId, skill_id })

        const update: Record<string, any> = {
          current_score: Math.max(existing?.current_score || 0, score),
          level_achieved_at: now,
        }
        if (score >= 70) update.current_level = assessment.target_level

        await userSkillsCol.findOneAndUpdate(
          { user_id: user.personId, skill_id },
          { $set: update, $setOnInsert: { user_id: user.personId, skill_id } },
          { upsert: true }
        )
      }
    }

    return res.status(201).json({ data: { id: String(insertResult.insertedId), user_id: user.personId, assessment_id, skill_id, answers, score, passed: !!passed, time_taken, completed_at: now } })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
