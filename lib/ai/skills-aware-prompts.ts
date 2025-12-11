/**
 * Skills-Aware AI Prompt System for React Native
 * Builds adaptive prompts based on user's skill proficiency
 */

import { getUserSkills } from '../storage/database'
import type {
  AITutorContext,
  SkillName,
  ProficiencyLevel,
  SkillProficiencyMap,
} from '../types/skills'

/**
 * Get user's skills proficiency map from local storage
 */
export async function getUserSkillsProficiencyMap(): Promise<SkillProficiencyMap> {
  const skills = await getUserSkills()

  if (Object.keys(skills).length === 0) {
    // Return beginner defaults for new users
    return {
      pronunciation: { level: 'beginner', score: 0 },
      vocabulary: { level: 'beginner', score: 0 },
      grammar: { level: 'beginner', score: 0 },
      comprehension: { level: 'beginner', score: 0 },
      conversation: { level: 'beginner', score: 0 },
    }
  }

  const proficiencyMap: SkillProficiencyMap = {}

  Object.entries(skills).forEach(([skillName, data]) => {
    const level = scoreToLevel(data.score)
    proficiencyMap[skillName as SkillName] = {
      level,
      score: data.score,
    }
  })

  // Fill in missing skills
  const allSkills: SkillName[] = ['pronunciation', 'vocabulary', 'grammar', 'comprehension', 'conversation']
  for (const skill of allSkills) {
    if (!proficiencyMap[skill]) {
      proficiencyMap[skill] = { level: 'beginner', score: 0 }
    }
  }

  return proficiencyMap
}

/**
 * Convert score to proficiency level
 */
function scoreToLevel(score: number): ProficiencyLevel {
  if (score >= 90) return 'fluent'
  if (score >= 80) return 'advanced'
  if (score >= 65) return 'intermediate'
  if (score >= 50) return 'elementary'
  return 'beginner'
}

/**
 * Calculate overall proficiency level
 */
function calculateOverallProficiency(proficiencyMap: SkillProficiencyMap): ProficiencyLevel {
  const scores = Object.values(proficiencyMap).map(s => s?.score || 0)
  const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
  return scoreToLevel(avgScore)
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
 * Build vocabulary guidance for AI
 */
function buildVocabularyGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "Use VERY simple vocabulary (1-2 syllable words). Avoid idioms. Use short sentences (5-8 words max).",
    elementary: "Use everyday common vocabulary. Simple sentence structures. Sentences can be 8-12 words.",
    intermediate: "Use varied everyday vocabulary with some advanced words. Complex sentences okay. Sentences 12-15 words.",
    advanced: "Use sophisticated vocabulary. Complex grammatical structures. Idioms and colloquialisms.",
    fluent: "Use native-level vocabulary including technical terms, idioms, slang, and cultural references.",
  }
  return guidance[level]
}

/**
 * Build grammar guidance for AI
 */
function buildGrammarGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "ONLY present simple tense. Subject-Verb-Object order. No conditionals, no passive voice.",
    elementary: "Present simple, present continuous, simple past. Basic 'will' future. Simple questions.",
    intermediate: "All basic tenses plus present perfect, past continuous. Simple conditionals.",
    advanced: "All tenses including perfect continuous. Complex conditionals. Advanced passive.",
    fluent: "Full grammatical range including nuanced tenses, mood, voice.",
  }
  return guidance[level]
}

/**
 * Build scaffolding level for AI
 */
function buildScaffoldingGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "MAXIMUM support. Break down EVERY concept. Explain word-by-word. Ask if they understand CONSTANTLY.",
    elementary: "HIGH support. Explain new concepts clearly. Check understanding frequently.",
    intermediate: "MODERATE support. Assume good comprehension. Explain only complex concepts.",
    advanced: "LIGHT support. Assume strong comprehension. Natural conversation flow.",
    fluent: "MINIMAL support. Treat as peer conversation. Only explain cultural nuances.",
  }
  return guidance[level]
}

/**
 * Build error correction approach
 */
function buildErrorCorrectionGuidance(level: ProficiencyLevel): string {
  const guidance: Record<ProficiencyLevel, string> = {
    beginner: "Correct EVERY error immediately but VERY gently. Make corrections feel like teaching moments.",
    elementary: "Correct major errors (grammar, core vocabulary). Let minor pronunciation/spelling slide.",
    intermediate: "Correct errors that impede understanding. Occasional reminders about recurring mistakes.",
    advanced: "Only correct significant errors or upon request. Frame as alternatives, not corrections.",
    fluent: "NO unsolicited corrections. Only provide feedback if explicitly asked.",
  }
  return guidance[level]
}

/**
 * Build conversation type specific guidance
 */
function buildConversationTypeGuidance(
  type: 'practice' | 'scenario' | 'translation_help',
  language: string
): string {
  switch (type) {
    case 'practice':
      return `
CONVERSATION TYPE: Free Practice
- Focus: Natural conversation in ${language}
- Let user lead topics but gently guide if they struggle
- Ask follow-up questions to encourage more speaking
- Celebrate effort and progress
`
    case 'scenario':
      return `
CONVERSATION TYPE: Real-World Scenario
- Focus: Practical situation simulation in ${language}
- Stay in character consistently
- Use scenario-appropriate vocabulary
- Help user practice phrases they'd actually use
`
    case 'translation_help':
      return `
CONVERSATION TYPE: Translation Assistance
- Focus: Explaining translation and meaning in ${language}
- Provide literal AND natural translations
- Explain grammar differences between languages
- Point out cultural nuances when relevant
`
    default:
      return ''
  }
}

/**
 * Build skill-specific notes
 */
function buildSkillSpecificNotes(proficiencyMap: SkillProficiencyMap): string {
  const notes: string[] = []

  Object.entries(proficiencyMap).forEach(([skillName, data]) => {
    if (!data) return
    if (data.score < 50) {
      notes.push(`⚠️ ${skillName.toUpperCase()}: Beginner level (${data.score}/100) - Needs significant support`)
    } else if (data.score < 65) {
      notes.push(`📝 ${skillName.toUpperCase()}: Elementary level (${data.score}/100) - Needs regular support`)
    }
  })

  if (notes.length === 0) {
    return '\n✅ User shows solid proficiency across all skills.\n'
  }

  return '\n⚠️ SKILLS NEEDING ATTENTION:\n' + notes.join('\n') + '\n'
}

/**
 * MAIN FUNCTION: Build Skills-Aware AI System Prompt
 */
export async function buildSkillsAwarePrompt(
  conversationType: 'practice' | 'scenario' | 'translation_help',
  language: string
): Promise<string> {
  const context = await getAITutorContext()
  const proficiencyMap = await getUserSkillsProficiencyMap()

  const vocabularyLevel = proficiencyMap.vocabulary?.level || 'beginner'
  const grammarLevel = proficiencyMap.grammar?.level || 'beginner'
  const teachingLevel = context.overall_proficiency

  const prompt = `
# SHAMWARI - AI LANGUAGE TUTOR - ${language.toUpperCase()}

You are **Shamwari** ("friend" in Shona), the friendly AI language tutor mascot of Nyuchi Lingo. You're a warm, encouraging helper bee who guides learners on their multilingual journey.

## YOUR PERSONALITY

- **Name**: Shamwari (meaning "friend" in Shona)
- **Personality**: Warm, patient, encouraging, playful but professional
- **Voice**: Friendly but knowledgeable, like a supportive teacher who genuinely cares
- **Style**: Use occasional bee/friend references naturally (e.g., "Let's buzz through this together!", "You're doing great, friend!")
- **Goal**: Help every learner feel confident and supported as they become multilingual

**IMPORTANT**: You ARE Shamwari. Introduce yourself as Shamwari when starting new conversations.

## USER PROFICIENCY PROFILE

**Overall Level**: ${context.overall_proficiency}

**Individual Skills**:
${context.skills
  .map(
    s => `- ${s.skill_name.toUpperCase()}: ${s.current_level} (${s.current_score}/100)${s.needs_improvement ? ' ⚠️ NEEDS FOCUS' : ''}`
  )
  .join('\n')}

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

${buildConversationTypeGuidance(conversationType, language)}

## LANGUAGES SUPPORTED

You can help users learn:
- **Shona** (chiShona) - Zimbabwe
- **Ndebele** (isiNdebele) - Zimbabwe/South Africa
- **Swahili** (Kiswahili) - East Africa
- **Chinese** (中文) - China

From **English** as the base language.

## CORE TEACHING PRINCIPLES

1. **Adapt to Proficiency**: STRICTLY follow the vocabulary, grammar, and scaffolding guidelines above.

2. **Be Encouraging**: Language learning is hard! Celebrate every attempt.

3. **Correct Gently**: Follow the error correction guidance above.

4. **Cultural Respect**: Share cultural context when appropriate. Foster appreciation.

5. **Phrase Learning Focus**: Connect conversations to practical phrases users can learn.

6. **Ubuntu Philosophy**: "I am because we are" - Learning together, growing together.

7. **Safe & Inclusive**: Keep all content appropriate. Be respectful of all cultures and identities.

## REMEMBER

Your goal as Shamwari: Help this learner progress from ${context.overall_proficiency} to the next level through supportive, adaptive, skills-based teaching!

You're Shamwari, their friendly learning companion. Make them feel welcomed, supported, and excited to learn!
`.trim()

  return prompt
}

/**
 * Get overall proficiency level
 */
export async function getUserOverallProficiency(): Promise<ProficiencyLevel> {
  const proficiencyMap = await getUserSkillsProficiencyMap()
  return calculateOverallProficiency(proficiencyMap)
}
