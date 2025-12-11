/**
 * Skills-Aware AI Prompt System
 * AI-First Architecture: AI reads user_skills for EVERY interaction
 *
 * This module builds adaptive prompts based on:
 * - User's current skill proficiency levels
 * - Recent assessment performance
 * - Learning pace and preferences
 * - Conversation type (practice, scenario, translation)
 */

import { createClient } from "@/lib/supabase/server"
import type {
  AITutorContext,
  SkillName,
  ProficiencyLevel,
  UserSkill,
  SkillProficiencyMap,
} from "@/lib/types/skills"

/**
 * Get user's skills proficiency map
 * CRITICAL: This is read by AI for EVERY interaction
 */
export async function getUserSkillsProficiencyMap(userId: string): Promise<SkillProficiencyMap> {
  const supabase = await createClient()

  const { data: userSkills, error } = await supabase
    .from("user_skills")
    .select(`
      skill_id,
      current_level,
      current_score,
      skills (
        name
      )
    `)
    .eq("user_id", userId)

  if (error) {
    console.error("[skills-aware-prompts] Error fetching user skills:", error)
    return {}
  }

  if (!userSkills || userSkills.length === 0) {
    // User hasn't taken any assessments yet - return beginner defaults
    return {
      pronunciation: { level: "beginner", score: 0 },
      vocabulary: { level: "beginner", score: 0 },
      grammar: { level: "beginner", score: 0 },
      comprehension: { level: "beginner", score: 0 },
      conversation: { level: "beginner", score: 0 },
    }
  }

  // Build proficiency map
  const proficiencyMap: SkillProficiencyMap = {}

  for (const userSkill of userSkills) {
    const skillName = userSkill.skills?.name as SkillName
    if (skillName) {
      proficiencyMap[skillName] = {
        level: userSkill.current_level as ProficiencyLevel,
        score: userSkill.current_score || 0,
      }
    }
  }

  // Fill in missing skills with beginner defaults
  const allSkills: SkillName[] = ["pronunciation", "vocabulary", "grammar", "comprehension", "conversation"]
  for (const skill of allSkills) {
    if (!proficiencyMap[skill]) {
      proficiencyMap[skill] = { level: "beginner", score: 0 }
    }
  }

  return proficiencyMap
}

/**
 * Get recent assessment performance
 * Helps AI understand what user struggles with
 */
async function getRecentAssessments(userId: string) {
  const supabase = await createClient()

  const { data: assessments } = await supabase
    .from("user_assessments")
    .select(`
      skill_id,
      score,
      passed,
      completed_at,
      skills (
        name
      )
    `)
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(5)

  if (!assessments) return []

  return assessments.map((a) => ({
    skill_name: a.skills?.name as SkillName,
    score: a.score,
    passed: a.passed,
    completed_at: a.completed_at,
  }))
}

/**
 * Calculate overall proficiency level
 * Average across all skills
 */
function calculateOverallProficiency(proficiencyMap: SkillProficiencyMap): ProficiencyLevel {
  const scores = Object.values(proficiencyMap).map((s) => s.score)
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length

  if (avgScore >= 90) return "fluent"
  if (avgScore >= 80) return "advanced"
  if (avgScore >= 65) return "intermediate"
  if (avgScore >= 50) return "elementary"
  return "beginner"
}

/**
 * Get full AI tutor context
 * Complete picture of user's proficiency for AI adaptation
 */
export async function getAITutorContext(userId: string): Promise<AITutorContext> {
  const proficiencyMap = await getUserSkillsProficiencyMap(userId)
  const recentAssessments = await getRecentAssessments(userId)

  const skills = Object.entries(proficiencyMap).map(([skillName, data]) => ({
    skill_name: skillName as SkillName,
    current_level: data.level,
    current_score: data.score,
    needs_improvement: data.score < 65, // Below intermediate needs focus
  }))

  return {
    user_id: userId,
    overall_proficiency: calculateOverallProficiency(proficiencyMap),
    skills,
    recent_assessments: recentAssessments,
  }
}

/**
 * Build vocabulary guidance for AI
 * Tells AI what complexity level to use
 */
function buildVocabularyGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "Use VERY simple vocabulary (1-2 syllable words). Avoid idioms. Use short sentences (5-8 words max). Repeat key words. Examples: 'Hello. How are you? I am fine.'",
    elementary: "Use everyday common vocabulary. Simple sentence structures. Introduce basic idioms with explanations. Sentences can be 8-12 words. Examples: 'Good morning! Did you sleep well last night?'",
    intermediate: "Use varied everyday vocabulary with some advanced words. Complex sentences okay. Common idioms fine. Sentences 12-15 words. Examples: 'I was wondering if you could help me understand this concept better?'",
    advanced: "Use sophisticated vocabulary. Complex grammatical structures. Idioms and colloquialisms. Natural sentence length. Examples: 'Given the circumstances, I think it would be prudent to reconsider our approach.'",
    fluent: "Use native-level vocabulary including technical terms, idioms, slang, and cultural references. Natural, unmodified language. Examples: 'That's a bit of a stretch, don't you think? Let's not put the cart before the horse.'",
  }

  return guidance[level]
}

/**
 * Build grammar guidance for AI
 * Tells AI what grammar complexity to use
 */
function buildGrammarGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "ONLY present simple tense. Subject-Verb-Object order. No conditionals, no passive voice, no complex clauses. 'I am', 'You are', 'He goes', 'She likes'.",
    elementary: "Present simple, present continuous, simple past. Basic 'will' future. Simple questions. 'I am eating', 'Did you go?', 'I will help you'.",
    intermediate: "All basic tenses plus present perfect, past continuous. Simple conditionals (if/then). Basic passive voice. 'I have been', 'If you go, I will come', 'It was made'.",
    advanced: "All tenses including perfect continuous. Complex conditionals. Advanced passive. Subjunctive mood. 'Had I known', 'Were it not for', 'It should have been done'.",
    fluent: "Full grammatical range including nuanced tenses, mood, voice. Natural code-switching between registers. Complete idiomatic fluency.",
  }

  return guidance[level]
}

/**
 * Build scaffolding level for AI
 * Tells AI how much support to provide
 */
function buildScaffoldingGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "MAXIMUM support. Break down EVERY concept. Explain word-by-word. Ask if they understand CONSTANTLY. Provide examples for everything. Correct immediately with gentle explanations.",
    elementary: "HIGH support. Explain new concepts clearly. Check understanding frequently. Provide examples when introducing new words. Correct errors with brief explanations.",
    intermediate: "MODERATE support. Assume good comprehension. Explain only complex concepts. Check understanding occasionally. Provide examples for difficult topics. Correct significant errors.",
    advanced: "LIGHT support. Assume strong comprehension. Explain only when asked or for very advanced topics. Let minor errors slide unless they impede communication. Natural conversation flow.",
    fluent: "MINIMAL support. Treat as peer conversation. Only explain cultural nuances or very specialized terms. No error correction unless requested. Fully natural interaction.",
  }

  return guidance[level]
}

/**
 * Build error correction approach
 * Tells AI how to handle mistakes
 */
function buildErrorCorrectionGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "Correct EVERY error immediately but VERY gently. Use format: 'Great try! We say [correct form] instead. Let's practice: [correct form].' Make corrections feel like teaching moments, not failures.",
    elementary: "Correct major errors (grammar, core vocabulary). Let minor pronunciation/spelling slide. Use format: 'Good! Just a small note: [correct form].' Keep it brief.",
    intermediate: "Correct errors that impede understanding. Occasional reminders about recurring mistakes. Use format: 'I understand! By the way, [correct form] would be more natural.'",
    advanced: "Only correct significant errors or upon request. Use format: 'Makes sense! Alternatively, you could say [correct form].' Frame as alternatives, not corrections.",
    fluent: "NO unsolicited corrections. Only provide feedback if explicitly asked. Treat as peer conversation.",
  }

  return guidance[level]
}

/**
 * Build conversation type specific guidance
 */
function buildConversationTypeGuidance(
  type: "practice" | "scenario" | "translation_help",
  language: string,
  proficiencyMap: SkillProficiencyMap
): string {
  const conversationSkill = proficiencyMap.conversation
  const comprehensionSkill = proficiencyMap.comprehension

  switch (type) {
    case "practice":
      return `
CONVERSATION TYPE: Free Practice
- Focus: Natural conversation in ${language}
- User's conversation skill: ${conversationSkill?.level} (${conversationSkill?.score}/100)
- Let user lead topics but gently guide if they struggle
- Ask follow-up questions to encourage more speaking
- Celebrate effort and progress
- If user seems stuck, suggest topics: greetings, daily activities, interests
`

    case "scenario":
      return `
CONVERSATION TYPE: Real-World Scenario
- Focus: Practical situation simulation in ${language}
- User's comprehension skill: ${comprehensionSkill?.level} (${comprehensionSkill?.score}/100)
- Stay in character consistently
- Use scenario-appropriate vocabulary (restaurant, shopping, travel, etc.)
- Provide realistic responses as the character would
- Help user practice phrases they'd actually use in this situation
`

    case "translation_help":
      return `
CONVERSATION TYPE: Translation Assistance
- Focus: Explaining translation and meaning in ${language}
- Provide literal AND natural translations
- Explain grammar differences between languages
- Point out cultural nuances when relevant
- Use examples to illustrate concepts
- Be patient with questions
`

    default:
      return ""
  }
}

/**
 * Build skill-specific notes
 * Alert AI to areas needing attention
 */
function buildSkillSpecificNotes(proficiencyMap: SkillProficiencyMap): string {
  const notes: string[] = []

  Object.entries(proficiencyMap).forEach(([skillName, data]) => {
    if (data.score < 50) {
      notes.push(`⚠️ ${skillName.toUpperCase()}: Beginner level (${data.score}/100) - Needs significant support`)
    } else if (data.score < 65) {
      notes.push(`📝 ${skillName.toUpperCase()}: Elementary level (${data.score}/100) - Needs regular support`)
    }
  })

  if (notes.length === 0) {
    return "\n✅ User shows solid proficiency across all skills. Maintain current teaching approach.\n"
  }

  return "\n⚠️ SKILLS NEEDING ATTENTION:\n" + notes.join("\n") + "\n"
}

/**
 * MAIN FUNCTION: Build Skills-Aware AI System Prompt
 * This is called for EVERY AI interaction
 */
export async function buildSkillsAwarePrompt(
  userId: string,
  conversationType: "practice" | "scenario" | "translation_help",
  language: string
): Promise<string> {
  // Get complete user proficiency context
  const context = await getAITutorContext(userId)
  const proficiencyMap = await getUserSkillsProficiencyMap(userId)

  // Get individual skill levels for targeted guidance
  const vocabularyLevel = proficiencyMap.vocabulary?.level || "beginner"
  const grammarLevel = proficiencyMap.grammar?.level || "beginner"
  const pronunciationLevel = proficiencyMap.pronunciation?.level || "beginner"

  // Use the LOWEST level for overall teaching approach (don't overwhelm user)
  const teachingLevel = context.overall_proficiency

  const prompt = `
# AI LANGUAGE TUTOR - ${language.toUpperCase()}

You are an adaptive AI language tutor for Nyuchi Lingo. Your role is to help learners become multilingual through personalized, skills-based teaching.

## USER PROFICIENCY PROFILE

**Overall Level**: ${context.overall_proficiency} (Average across all skills)

**Individual Skills**:
${context.skills
  .map(
    (s) =>
      `- ${s.skill_name.toUpperCase()}: ${s.current_level} (${s.current_score}/100)${s.needs_improvement ? " ⚠️ NEEDS FOCUS" : ""}`
  )
  .join("\n")}

${buildSkillSpecificNotes(proficiencyMap)}

## TEACHING APPROACH FOR ${teachingLevel.toUpperCase()} LEVEL

### Vocabulary Complexity
${buildVocabularyGuidance(vocabularyLevel)}

### Grammar Complexity
${buildGrammarGuidance(grammarLevel)}

### Scaffolding Level (Support)
${buildScaffoldingGuidance(teachingLevel)}

### Error Correction Approach
${buildErrorCorrectionGuidance(teachingLevel)}

${buildConversationTypeGuidance(conversationType, language, proficiencyMap)}

## RECENT PERFORMANCE CONTEXT

${
  context.recent_assessments.length > 0
    ? `Recent assessments:
${context.recent_assessments
  .map((a) => `- ${a.skill_name}: ${a.score}/100 (${a.passed ? "✅ PASSED" : "❌ FAILED"}) - ${new Date(a.completed_at).toLocaleDateString()}`)
  .join("\n")}`
    : "ℹ️ No assessments completed yet. This is an early learner - provide maximum support and encouragement!"
}

## CORE TEACHING PRINCIPLES

1. **Adapt to Proficiency**: STRICTLY follow the vocabulary, grammar, and scaffolding guidelines above. If user is beginner, use beginner language. If advanced, use advanced language.

2. **Be Encouraging**: Language learning is hard! Celebrate every attempt. Say things like "Great effort!", "You're improving!", "Perfect!", "Almost there!"

3. **Correct Gently**: Follow the error correction guidance above. Never make learners feel bad about mistakes.

4. **Cultural Respect**: ${language} is connected to rich cultures. When appropriate, share cultural context, traditions, or interesting facts. Foster appreciation, not appropriation.

5. **Phrase Learning Focus**: Remember, Nyuchi Lingo is primarily a phrase learning platform. When relevant, connect conversations to practical phrases users can learn and use.

6. **Track Progress**: Notice when users improve! Reference their proficiency levels naturally: "You're at ${teachingLevel} level now - that's great progress!"

7. **Safe & Inclusive**: Keep all content appropriate for ages 13+. Be respectful of all cultures, identities, and backgrounds.

8. **Responsive to Questions**: If user asks for explanations, grammar help, or translations, switch into teaching mode and explain clearly at their level.

## REMEMBER

- You're seeing this user's ACTUAL proficiency levels from their assessment results
- This is NOT a guess - these scores are from real tests they've taken
- Adapt your language complexity to match their demonstrated skills
- If they seem to struggle more than their scores suggest, offer more support
- If they seem to exceed their scores, you can gently increase complexity

Your goal: Help this learner progress from ${context.overall_proficiency} to the next level through supportive, adaptive, skills-based teaching!
`.trim()

  return prompt
}

/**
 * Get user's current overall proficiency (for quick checks)
 */
export async function getUserOverallProficiency(userId: string): Promise<ProficiencyLevel> {
  const proficiencyMap = await getUserSkillsProficiencyMap(userId)
  return calculateOverallProficiency(proficiencyMap)
}

/**
 * Check if user needs diagnostic assessment
 * Returns true if user has no skill scores yet
 */
export async function userNeedsDiagnosticAssessment(userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { count } = await supabase
    .from("user_skills")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)

  return (count || 0) === 0
}

/**
 * Get recommended phrases based on skills
 * Filters phrases appropriate for user's proficiency
 */
export async function getSkillsRecommendedPhrases(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  const supabase = await createClient()
  const proficiencyMap = await getUserSkillsProficiencyMap(userId)

  // Find user's weakest skill to focus practice
  const weakestSkill = Object.entries(proficiencyMap).sort((a, b) => a[1].score - b[1].score)[0]

  if (!weakestSkill) return []

  const [skillName, skillData] = weakestSkill

  // Get skill ID
  const { data: skill } = await supabase.from("skills").select("id").eq("name", skillName).single()

  if (!skill) return []

  // Get phrases for this skill at or below user's level
  const { data: phrases } = await supabase
    .from("phrases")
    .select("*")
    .eq("skill_id", skill.id)
    .lte("difficulty_score", skillData.score / 20) // Convert 0-100 to 0-5 difficulty
    .limit(limit)

  return phrases || []
}
