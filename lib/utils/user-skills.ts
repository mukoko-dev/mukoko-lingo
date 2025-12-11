/**
 * User Skills Utility Functions
 * Helper functions for managing user proficiency and skills
 */

import { createClient } from "@/lib/supabase/server"
import type { UserSkill, UserSkillWithDetails, ProficiencyLevel, SkillName } from "@/lib/types/skills"

/**
 * Get all user skills with details
 */
export async function getUserSkillsWithDetails(userId: string): Promise<UserSkillWithDetails[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("user_skills")
    .select(`
      *,
      skill:skills (
        id,
        name,
        display_name,
        description,
        icon,
        sort_order,
        is_active,
        created_at
      ),
      level:skill_levels!skill_levels_skill_id_fkey (
        id,
        skill_id,
        level,
        display_name,
        description,
        min_score,
        sort_order
      )
    `)
    .eq("user_id", userId)
    .order("skill.sort_order", { ascending: true })

  if (error) {
    console.error("[user-skills] Error fetching user skills:", error)
    return []
  }

  return (data as unknown as UserSkillWithDetails[]) || []
}

/**
 * Get user's proficiency for a specific skill
 */
export async function getUserSkillLevel(userId: string, skillName: SkillName): Promise<ProficiencyLevel> {
  const supabase = await createClient()

  const { data: skill } = await supabase.from("skills").select("id").eq("name", skillName).single()

  if (!skill) return "beginner"

  const { data: userSkill } = await supabase
    .from("user_skills")
    .select("current_level")
    .eq("user_id", userId)
    .eq("skill_id", skill.id)
    .single()

  return (userSkill?.current_level as ProficiencyLevel) || "beginner"
}

/**
 * Get user's overall proficiency level
 * Calculates average of all skill scores
 */
export async function getUserOverallProficiency(userId: string): Promise<{
  level: ProficiencyLevel
  score: number
}> {
  const supabase = await createClient()

  // Get all user skills and calculate average
  const { data: userSkills, error } = await supabase
    .from("user_skills")
    .select("current_score, current_level")
    .eq("user_id", userId)

  if (error || !userSkills || userSkills.length === 0) {
    return { level: "beginner", score: 0 }
  }

  // Calculate average score
  const totalScore = userSkills.reduce((sum, skill) => sum + (skill.current_score || 0), 0)
  const avgScore = Math.round(totalScore / userSkills.length)

  // Determine level based on average score
  let level: ProficiencyLevel = "beginner"
  if (avgScore >= 90) level = "fluent"
  else if (avgScore >= 80) level = "advanced"
  else if (avgScore >= 65) level = "intermediate"
  else if (avgScore >= 50) level = "elementary"

  return { level, score: avgScore }
}

/**
 * Initialize user skills
 * Creates user_skills entries for all skills at beginner level
 * Called after first diagnostic assessment
 */
export async function initializeUserSkills(userId: string): Promise<void> {
  const supabase = await createClient()

  // Get all active skills
  const { data: skills } = await supabase.from("skills").select("id").eq("is_active", true)

  if (!skills || skills.length === 0) {
    console.error("[user-skills] No active skills found")
    return
  }

  // Create user_skills entry for each skill
  const userSkills = skills.map((skill) => ({
    user_id: userId,
    skill_id: skill.id,
    current_level: "beginner" as ProficiencyLevel,
    current_score: 0,
    total_practice_time: 0,
  }))

  const { error } = await supabase.from("user_skills").insert(userSkills)

  if (error) {
    console.error("[user-skills] Error initializing user skills:", error)
  }
}

/**
 * Get user's weakest skill
 * Returns skill that needs most improvement
 */
export async function getUserWeakestSkill(userId: string): Promise<{
  skillName: SkillName
  currentLevel: ProficiencyLevel
  currentScore: number
} | null> {
  const skills = await getUserSkillsWithDetails(userId)

  if (skills.length === 0) return null

  // Find skill with lowest score
  const weakest = skills.reduce((min, skill) => (skill.current_score < min.current_score ? skill : min))

  return {
    skillName: weakest.skill.name as SkillName,
    currentLevel: weakest.current_level,
    currentScore: weakest.current_score,
  }
}

/**
 * Get user's strongest skill
 * Returns skill user is best at
 */
export async function getUserStrongestSkill(userId: string): Promise<{
  skillName: SkillName
  currentLevel: ProficiencyLevel
  currentScore: number
} | null> {
  const skills = await getUserSkillsWithDetails(userId)

  if (skills.length === 0) return null

  // Find skill with highest score
  const strongest = skills.reduce((max, skill) => (skill.current_score > max.current_score ? skill : max))

  return {
    skillName: strongest.skill.name as SkillName,
    currentLevel: strongest.current_level,
    currentScore: strongest.current_score,
  }
}

/**
 * Calculate progress to next level for a skill
 * Returns percentage progress (0-100)
 */
export async function calculateProgressToNextLevel(
  userId: string,
  skillName: SkillName
): Promise<{
  currentLevel: ProficiencyLevel
  nextLevel: ProficiencyLevel | null
  currentScore: number
  nextLevelThreshold: number | null
  progressPercentage: number
} | null> {
  const supabase = await createClient()

  // Get skill ID
  const { data: skill } = await supabase.from("skills").select("id").eq("name", skillName).single()

  if (!skill) return null

  // Get user's current skill level
  const { data: userSkill } = await supabase
    .from("user_skills")
    .select("current_level, current_score")
    .eq("user_id", userId)
    .eq("skill_id", skill.id)
    .single()

  if (!userSkill) return null

  // Get all levels for this skill
  const { data: levels } = await supabase
    .from("skill_levels")
    .select("level, min_score")
    .eq("skill_id", skill.id)
    .order("min_score", { ascending: true })

  if (!levels || levels.length === 0) return null

  // Find current and next level
  const currentLevelIndex = levels.findIndex((l) => l.level === userSkill.current_level)
  const nextLevel = currentLevelIndex < levels.length - 1 ? levels[currentLevelIndex + 1] : null

  if (!nextLevel) {
    // User is at max level
    return {
      currentLevel: userSkill.current_level as ProficiencyLevel,
      nextLevel: null,
      currentScore: userSkill.current_score,
      nextLevelThreshold: null,
      progressPercentage: 100,
    }
  }

  const currentThreshold = levels[currentLevelIndex].min_score
  const nextThreshold = nextLevel.min_score
  const scoreInCurrentLevel = userSkill.current_score - currentThreshold
  const scoreNeededForNextLevel = nextThreshold - currentThreshold
  const progressPercentage = Math.min(100, Math.round((scoreInCurrentLevel / scoreNeededForNextLevel) * 100))

  return {
    currentLevel: userSkill.current_level as ProficiencyLevel,
    nextLevel: nextLevel.level as ProficiencyLevel,
    currentScore: userSkill.current_score,
    nextLevelThreshold: nextThreshold,
    progressPercentage,
  }
}

/**
 * Get phrases recommended for user's current skill levels
 * Filters phrases appropriate for user's proficiency
 */
export async function getRecommendedPhrases(userId: string, limit: number = 20): Promise<any[]> {
  const supabase = await createClient()

  // Get user's overall proficiency
  const { score: overallScore } = await getUserOverallProficiency(userId)

  // Map score to difficulty (1-5)
  const maxDifficulty = Math.ceil(overallScore / 20) // 0-20 = 1, 21-40 = 2, etc.

  // Get phrases at or below user's level
  const { data: phrases } = await supabase
    .from("phrases")
    .select("*")
    .lte("difficulty_score", maxDifficulty)
    .limit(limit)

  return phrases || []
}

/**
 * Get skills dashboard summary
 * Complete overview of user's progress
 */
export async function getSkillsDashboardSummary(userId: string) {
  const supabase = await createClient()

  // Get all user skills with details
  const skills = await getUserSkillsWithDetails(userId)

  // Get overall proficiency
  const overall = await getUserOverallProficiency(userId)

  // Get total assessments
  const { count: totalAssessments } = await supabase
    .from("user_assessments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  const { count: passedAssessments } = await supabase
    .from("user_assessments")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("passed", true)

  // Get phrases mastered
  const { count: phrasesMastered } = await supabase
    .from("phrase_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "mastered")

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("current_streak, last_study_date")
    .eq("id", userId)
    .single()

  return {
    user_id: userId,
    overall_proficiency: overall.level,
    overall_score: overall.score,
    skills: skills.map((s) => ({
      skill_name: s.skill.name,
      current_level: s.current_level,
      current_score: s.current_score,
      total_practice_time: s.total_practice_time,
      last_practiced: s.last_practiced_at,
    })),
    total_practice_time: skills.reduce((sum, s) => sum + s.total_practice_time, 0),
    assessments_completed: totalAssessments || 0,
    assessments_passed: passedAssessments || 0,
    phrases_mastered: phrasesMastered || 0,
    current_streak: profile?.current_streak || 0,
    last_practice: profile?.last_study_date || null,
  }
}

/**
 * Check if user should take diagnostic assessment
 * Returns true if user has no proficiency data
 */
export async function shouldTakeDiagnosticAssessment(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { count } = await supabase
    .from("user_skills")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  return (count || 0) === 0
}

/**
 * Get skill by name
 */
export async function getSkillByName(skillName: SkillName) {
  const supabase = await createClient()

  const { data, error } = await supabase.from("skills").select("*").eq("name", skillName).single()

  if (error) {
    console.error(`[user-skills] Error fetching skill ${skillName}:`, error)
    return null
  }

  return data
}

/**
 * Get all active skills
 */
export async function getAllSkills() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("skills")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[user-skills] Error fetching skills:", error)
    return []
  }

  return data || []
}

/**
 * Get skill levels for a specific skill
 */
export async function getSkillLevels(skillId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("skill_levels")
    .select("*")
    .eq("skill_id", skillId)
    .order("sort_order", { ascending: true })

  if (error) {
    console.error("[user-skills] Error fetching skill levels:", error)
    return []
  }

  return data || []
}
