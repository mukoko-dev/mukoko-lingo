import { phrases, type Phrase } from '@/lib/data/phrases-data'
import {
  getProgress,
  getUserSkills,
  getDailyLesson,
  setDailyLesson,
  getDailyGoalProgress,
  updateDailyGoalProgress,
} from '@/lib/storage/database'
import { getDueCards, type SRSCard } from './srs'

const DAILY_GOAL = 5
const SRS_REVIEW_SLOTS = 2 // Reserve 2 of the 5 daily slots for SRS reviews

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

  // Generate a new lesson mixing SRS reviews with new content
  const progress = await getProgress()
  const skills = await getUserSkills()

  // Get SRS due cards first — these take priority
  const dueCards = await getDueCards()
  const dueIds = new Set(dueCards.map((c: SRSCard) => c.phraseId))

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

  // Build lesson: SRS reviews first, then new content
  const selected: Phrase[] = []
  const usedIds = new Set<string>()
  const usedCategories = new Set<string>()

  // Step 1: Add SRS due reviews (up to SRS_REVIEW_SLOTS)
  const srsReviews = dueCards.slice(0, SRS_REVIEW_SLOTS)
  for (const card of srsReviews) {
    const phrase = phrases.find(p => p.id === card.phraseId)
    if (phrase) {
      selected.push(phrase)
      usedIds.add(phrase.id)
      usedCategories.add(phrase.category)
    }
  }

  const newSlots = DAILY_GOAL - selected.length

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

  // Step 2: Fill remaining slots with new content
  // Priority order: weak skills → not practiced → any unmastered → any
  addPhrases(fromWeakSkills.filter(p => !progress[p.id] && !dueIds.has(p.id)), DAILY_GOAL)
  addPhrases(notPracticed.filter(p => !dueIds.has(p.id)), DAILY_GOAL)
  addPhrases(unmastered.filter(p => !dueIds.has(p.id)), DAILY_GOAL)
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
