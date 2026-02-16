import { phrases, type Phrase } from '@/lib/data/phrases-data'
import {
  getProgress,
  getUserSkills,
  getDailyLesson,
  setDailyLesson,
  getDailyGoalProgress,
  updateDailyGoalProgress,
} from '@/lib/storage/database'

const DAILY_GOAL = 5

// Map phrase categories to skill areas
const CATEGORY_SKILL_MAP: Record<string, string> = {
  greetings: 'conversation',
  family: 'vocabulary',
  shopping: 'conversation',
  food: 'vocabulary',
  directions: 'comprehension',
  work: 'vocabulary',
  home: 'vocabulary',
  social: 'conversation',
  health: 'vocabulary',
  transport: 'comprehension',
  school: 'grammar',
  money: 'vocabulary',
  weather: 'vocabulary',
  emotions: 'conversation',
}

export function getSkillForCategory(category: string): string {
  return CATEGORY_SKILL_MAP[category] || 'vocabulary'
}

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Get or generate today's lesson phrases.
 * Prioritizes: unmastered phrases from weakest skills, not recently practiced, mixed categories.
 */
export async function getTodaysLesson(): Promise<Phrase[]> {
  const today = getTodayString()

  // Check if we already have a lesson for today
  const existing = await getDailyLesson(today)
  if (existing && existing.length > 0) {
    return phrases.filter(p => existing.includes(p.id))
  }

  // Generate a new lesson
  const progress = await getProgress()
  const skills = await getUserSkills()

  // Find weakest skills to prioritize
  const skillScores = Object.entries(skills).map(([name, data]) => ({ name, score: data.score }))
  skillScores.sort((a, b) => a.score - b.score)
  const weakSkills = skillScores.length > 0
    ? skillScores.slice(0, 2).map(s => s.name)
    : ['vocabulary', 'conversation']

  // Categorize phrases by priority
  const unmastered = phrases.filter(p => {
    const prog = progress[p.id]
    return !prog || prog.status !== 'mastered'
  })

  const notPracticed = unmastered.filter(p => {
    const prog = progress[p.id]
    return !prog
  })

  const fromWeakSkills = unmastered.filter(p => {
    const skill = getSkillForCategory(p.category)
    return weakSkills.includes(skill)
  })

  // Build lesson: prioritize weak skills, then unpracticed, then any unmastered
  const selected: Phrase[] = []
  const usedIds = new Set<string>()
  const usedCategories = new Set<string>()

  // Helper to add phrases while maintaining variety
  const addPhrases = (pool: Phrase[], max: number) => {
    // Shuffle for variety
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    for (const p of shuffled) {
      if (selected.length >= max) break
      if (usedIds.has(p.id)) continue
      // Prefer variety across categories
      if (usedCategories.size < 3 || !usedCategories.has(p.category) || selected.length >= max - 1) {
        selected.push(p)
        usedIds.add(p.id)
        usedCategories.add(p.category)
      }
    }
  }

  // Priority order: weak skills → not practiced → any unmastered → any
  addPhrases(fromWeakSkills.filter(p => !progress[p.id]), DAILY_GOAL)
  addPhrases(notPracticed, DAILY_GOAL)
  addPhrases(unmastered, DAILY_GOAL)
  if (selected.length < DAILY_GOAL) {
    addPhrases(phrases, DAILY_GOAL)
  }

  const lessonIds = selected.slice(0, DAILY_GOAL).map(p => p.id)
  await setDailyLesson(today, lessonIds)

  return selected.slice(0, DAILY_GOAL)
}

/**
 * Get today's daily goal progress
 */
export async function getTodayProgress(): Promise<{ learned: number; goal: number; completed: boolean }> {
  return getDailyGoalProgress(getTodayString())
}

/**
 * Mark a phrase as learned in today's goal and return updated progress
 */
export async function markPhraseLearned(): Promise<{ learned: number; goal: number; completed: boolean; justCompleted: boolean }> {
  const today = getTodayString()
  const current = await getDailyGoalProgress(today)
  const wasCompleted = current.completed
  const newLearned = current.learned + 1
  await updateDailyGoalProgress(today, newLearned)
  const updated = await getDailyGoalProgress(today)
  return {
    ...updated,
    justCompleted: !wasCompleted && updated.completed,
  }
}

/**
 * Generate quiz questions from a set of phrases
 */
export function generateQuizQuestions(
  lessonPhrases: Phrase[],
  language: 'shona' | 'ndebele' | 'swahili' | 'chinese'
): Array<{
  id: string
  english: string
  correctAnswer: string
  options: string[]
  phraseId: string
}> {
  // Get all phrases for wrong answers
  const allTranslations = phrases.map(p => p[language]).filter(Boolean)

  return lessonPhrases.map(phrase => {
    const correct = phrase[language]

    // Pick 2 random wrong answers from other phrases
    const wrongAnswers: string[] = []
    const shuffled = [...allTranslations].sort(() => Math.random() - 0.5)
    for (const t of shuffled) {
      if (wrongAnswers.length >= 2) break
      if (t !== correct && !wrongAnswers.includes(t)) {
        wrongAnswers.push(t)
      }
    }

    // Shuffle all options
    const options = [correct, ...wrongAnswers].sort(() => Math.random() - 0.5)

    return {
      id: `quiz-${phrase.id}`,
      english: phrase.english,
      correctAnswer: correct,
      options,
      phraseId: phrase.id,
    }
  })
}
