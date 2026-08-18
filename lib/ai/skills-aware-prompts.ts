/**
 * Skills-Aware AI Prompt System for React Native
 *
 * Reads the learner's proficiency from local storage and builds an adaptive
 * prompt from it.
 *
 * NOTE: this is no longer what frames a live chat request. `/api/ai/chat`
 * builds the system prompt server-side from the authenticated user's stored
 * proficiency and ignores anything the client sends, because a prompt supplied
 * by the caller is a prompt the caller can replace. This module remains for
 * the offline/simulated path and for surfacing proficiency in the UI.
 *
 * The prompt text and the level thresholds live in `./prompt-builder`, shared
 * with the server so the two cannot drift apart.
 */

import { getUserSkills } from '../storage/database'
import {
  ALL_SKILL_NAMES,
  buildTutorPrompt,
  calculateOverallProficiency,
  defaultProficiencyMap,
  normalizeConversationType,
  normalizeLanguage,
  scoreToLevel,
  type ConversationType,
} from './prompt-builder'
import type {
  AITutorContext,
  SkillName,
  ProficiencyLevel,
  SkillProficiencyMap,
} from '../types/skills'

export { scoreToLevel } from './prompt-builder'

/**
 * Get user's skills proficiency map from local storage
 */
export async function getUserSkillsProficiencyMap(): Promise<SkillProficiencyMap> {
  const skills = await getUserSkills()

  if (Object.keys(skills).length === 0) {
    // Return beginner defaults for new users
    return defaultProficiencyMap()
  }

  const proficiencyMap: SkillProficiencyMap = {}

  Object.entries(skills).forEach(([skillName, data]) => {
    proficiencyMap[skillName as SkillName] = {
      level: scoreToLevel(data.score),
      score: data.score,
    }
  })

  // Fill in missing skills
  for (const skill of ALL_SKILL_NAMES) {
    if (!proficiencyMap[skill]) {
      proficiencyMap[skill] = { level: 'beginner', score: 0 }
    }
  }

  return proficiencyMap
}

/**
 * Get AI tutor context
 */
export async function getAITutorContext(): Promise<AITutorContext> {
  const proficiencyMap = await getUserSkillsProficiencyMap()

  const skills = Object.entries(proficiencyMap).map(([skillName, data]) => ({
    skill_name: skillName as SkillName,
    current_level: data?.level || 'beginner',
    current_score: data?.score || 0,
    needs_improvement: (data?.score || 0) < 65,
  }))

  return {
    user_id: 'local',
    overall_proficiency: calculateOverallProficiency(proficiencyMap),
    skills,
    recent_assessments: [],
  }
}

/**
 * Build the Shamwari system prompt from locally stored proficiency.
 */
export async function buildSkillsAwarePrompt(
  conversationType: ConversationType,
  language: string
): Promise<string> {
  const proficiencyMap = await getUserSkillsProficiencyMap()

  return buildTutorPrompt({
    proficiencyMap,
    conversationType: normalizeConversationType(conversationType),
    language: normalizeLanguage(language),
  })
}

/**
 * Get overall proficiency level
 */
export async function getUserOverallProficiency(): Promise<ProficiencyLevel> {
  const proficiencyMap = await getUserSkillsProficiencyMap()
  return calculateOverallProficiency(proficiencyMap)
}
