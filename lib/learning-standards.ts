import { createClient } from "@/lib/supabase/server"

export interface LearningStandard {
  id: string
  level: "beginner" | "novice" | "advanced" | "fluent"
  level_order: number
  title: string
  description: string
  criteria: Record<string, any>
  vocabulary_range: string | null
  conversation_types: string[] | null
  grammar_concepts: string[] | null
  ai_prompt_template: string | null
  example_phrases: string[] | null
  is_active: boolean
}

export interface UserLearningContext {
  user_id: string
  current_level: "beginner" | "novice" | "advanced" | "fluent"
  mastered_phrases_count: number
  practicing_phrases_count: number
  total_practice_time: number
  streak_days: number
  target_languages: string[]
}

/**
 * Get all active learning standards ordered by level
 */
export async function getLearningStandards(): Promise<LearningStandard[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("learning_standards")
    .select("*")
    .eq("is_active", true)
    .order("level_order", { ascending: true })

  if (error) {
    console.error("[learning-standards] Error fetching standards:", error)
    return []
  }

  return data || []
}

/**
 * Get learning standard for a specific level
 */
export async function getLearningStandardByLevel(
  level: "beginner" | "novice" | "advanced" | "fluent"
): Promise<LearningStandard | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("learning_standards")
    .select("*")
    .eq("level", level)
    .eq("is_active", true)
    .single()

  if (error) {
    console.error(`[learning-standards] Error fetching standard for level ${level}:`, error)
    return null
  }

  return data
}

/**
 * Determine user's current learning level based on their progress
 */
export async function getUserLearningLevel(userId: string): Promise<"beginner" | "novice" | "advanced" | "fluent"> {
  const supabase = await createClient()

  // Fetch user's progress
  const { data: progress } = await supabase
    .from("phrase_progress")
    .select("status, times_practiced")
    .eq("user_id", userId)

  if (!progress || progress.length === 0) {
    return "beginner"
  }

  const masteredCount = progress.filter(p => p.status === "mastered").length
  const practicedCount = progress.filter(p => p.status === "practiced").length
  const totalPractice = progress.reduce((sum, p) => sum + (p.times_practiced || 0), 0)

  // Level determination algorithm
  if (masteredCount >= 100 && totalPractice >= 500) {
    return "fluent"
  } else if (masteredCount >= 50 && totalPractice >= 200) {
    return "advanced"
  } else if (masteredCount >= 15 && totalPractice >= 50) {
    return "novice"
  } else {
    return "beginner"
  }
}

/**
 * Get comprehensive user learning context
 */
export async function getUserLearningContext(userId: string): Promise<UserLearningContext> {
  const supabase = await createClient()

  // Fetch all relevant data in parallel
  const [
    { data: progress },
    { data: sessions },
    { data: profile },
  ] = await Promise.all([
    supabase.from("phrase_progress").select("status, times_practiced").eq("user_id", userId),
    supabase.from("study_sessions").select("phrases_studied, time_spent_minutes, session_date").eq("user_id", userId),
    supabase.from("profiles").select("target_language, current_streak").eq("user_id", userId).single(),
  ])

  const masteredCount = progress?.filter(p => p.status === "mastered").length || 0
  const practicingCount = progress?.filter(p => p.status === "practicing" || p.status === "learning").length || 0
  const totalPracticeTime = sessions?.reduce((sum, s) => sum + (s.time_spent_minutes || 0), 0) || 0
  const currentLevel = await getUserLearningLevel(userId)

  return {
    user_id: userId,
    current_level: currentLevel,
    mastered_phrases_count: masteredCount,
    practicing_phrases_count: practicingCount,
    total_practice_time: totalPracticeTime,
    streak_days: profile?.current_streak || 0,
    target_languages: profile?.target_language ? [profile.target_language] : ["shona"],
  }
}

/**
 * Build AI system prompt incorporating learning standards
 */
export async function buildAISystemPrompt(
  userId: string,
  type: "practice" | "scenario" | "translation_help",
  language: string
): Promise<string> {
  // Get user's learning context
  const context = await getUserLearningContext(userId)
  const standard = await getLearningStandardByLevel(context.current_level)

  if (!standard || !standard.ai_prompt_template) {
    // Fallback to basic prompts if standards not available
    return getBasicPrompt(type, language, context.current_level)
  }

  // Use the learning standard's AI prompt template
  let basePrompt = standard.ai_prompt_template

  // Customize based on conversation type
  switch (type) {
    case "practice":
      basePrompt += `\n\nFocus: Free-form practice conversation in ${language}.`
      basePrompt += `\nVocabulary Level: ${standard.vocabulary_range}`
      if (standard.conversation_types && standard.conversation_types.length > 0) {
        basePrompt += `\nSuggested Topics: ${standard.conversation_types.join(", ")}`
      }
      break

    case "scenario":
      basePrompt += `\n\nFocus: Real-world scenario simulation in ${language}.`
      basePrompt += `\nStay in character and keep complexity appropriate for ${context.current_level} level.`
      if (standard.example_phrases && standard.example_phrases.length > 0) {
        basePrompt += `\nExample phrases for this level: ${standard.example_phrases.slice(0, 3).join(", ")}`
      }
      break

    case "translation_help":
      basePrompt += `\n\nFocus: Translation assistance for ${language}.`
      basePrompt += `\nExplanation Depth: ${context.current_level === "beginner" ? "Simple and clear" : context.current_level === "fluent" ? "Detailed with cultural nuances" : "Moderate detail"}`
      if (standard.grammar_concepts && standard.grammar_concepts.length > 0) {
        basePrompt += `\nGrammar Concepts to Reference: ${standard.grammar_concepts.join(", ")}`
      }
      break
  }

  // Add user context
  basePrompt += `\n\nUser Progress:`
  basePrompt += `\n- Learning Level: ${context.current_level}`
  basePrompt += `\n- Mastered Phrases: ${context.mastered_phrases_count}`
  basePrompt += `\n- Current Streak: ${context.streak_days} days`

  // Add community spirit and guardrails reminder
  basePrompt += `\n\nCommunity Values:`
  basePrompt += `\n- Be encouraging and supportive`
  basePrompt += `\n- Celebrate progress, no matter how small`
  basePrompt += `\n- Correct mistakes gently and constructively`
  basePrompt += `\n- Foster cultural appreciation and respect`
  basePrompt += `\n- Keep conversations safe, inclusive, and appropriate for all ages (13+)`

  return basePrompt
}

/**
 * Fallback prompts if learning standards not available
 */
function getBasicPrompt(
  type: "practice" | "scenario" | "translation_help",
  language: string,
  level: string
): string {
  const levelGuidance = {
    beginner: "Use simple vocabulary and short sentences. Explain concepts clearly.",
    novice: "Use everyday vocabulary with some variation. Provide helpful context.",
    advanced: "Use varied vocabulary and complex sentences. Assume good comprehension.",
    fluent: "Use natural, fluent language with idioms and cultural references.",
  }

  let prompt = ""

  switch (type) {
    case "practice":
      prompt = `You are a friendly ${language} language tutor at ${level} level. ${levelGuidance[level as keyof typeof levelGuidance]} Be encouraging and correct mistakes gently.`
      break
    case "scenario":
      prompt = `You are simulating a real-world conversation in ${language} appropriate for ${level} learners. ${levelGuidance[level as keyof typeof levelGuidance]} Stay in character.`
      break
    case "translation_help":
      prompt = `You are a translation expert for ${language}. Provide explanations appropriate for ${level} learners. ${levelGuidance[level as keyof typeof levelGuidance]}`
      break
  }

  prompt += `\n\nAlways be respectful, inclusive, and foster a positive learning community.`

  return prompt
}

/**
 * Check if content aligns with learning standards (for feed recommendations)
 */
export function evaluatePhraseForLevel(
  phrase: { category: string; english: string },
  userLevel: "beginner" | "novice" | "advanced" | "fluent"
): number {
  // Scoring algorithm based on level appropriateness
  let score = 50 // Base score

  // Essential categories for beginners
  const beginnerCategories = ["greetings", "basics", "common-phrases", "numbers"]
  const noviceCategories = [...beginnerCategories, "travel", "food", "directions"]
  const advancedCategories = [...noviceCategories, "business", "culture", "idioms"]

  if (userLevel === "beginner" && beginnerCategories.includes(phrase.category)) {
    score += 30
  } else if (userLevel === "novice" && noviceCategories.includes(phrase.category)) {
    score += 20
  } else if (userLevel === "advanced" && advancedCategories.includes(phrase.category)) {
    score += 15
  } else if (userLevel === "fluent") {
    score += 10 // All content appropriate
  }

  // Phrase complexity (simple heuristic based on word count)
  const wordCount = phrase.english.split(" ").length

  if (userLevel === "beginner" && wordCount <= 5) {
    score += 10
  } else if (userLevel === "novice" && wordCount <= 8) {
    score += 10
  } else if (userLevel === "advanced" && wordCount <= 12) {
    score += 5
  }

  return Math.min(100, score)
}
