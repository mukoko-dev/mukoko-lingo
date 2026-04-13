/**
 * Spaced Repetition System (SRS) — SM-2 Algorithm
 *
 * Implements the SuperMemo SM-2 algorithm for optimal phrase review scheduling.
 * Each phrase tracks: easiness factor, interval, repetition count, and next review date.
 *
 * Quality ratings (0-5):
 *   0 = Complete blackout
 *   1 = Wrong, but recognized after seeing answer
 *   2 = Wrong, but answer seemed easy to recall
 *   3 = Correct, but with significant difficulty
 *   4 = Correct, with some hesitation
 *   5 = Perfect, instant recall
 *
 * Integration: SRS state is stored locally (AsyncStorage/SQLite) and optionally
 * synced to Supabase for cross-device persistence.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'

const SRS_STORAGE_KEY = '@mukoko_srs_data'

// ============================================================================
// Types
// ============================================================================

export interface SRSCard {
  phraseId: string
  easinessFactor: number   // EF, starts at 2.5, min 1.3
  interval: number         // Days until next review
  repetitions: number      // Consecutive correct answers
  nextReviewDate: string   // ISO date string (YYYY-MM-DD)
  lastReviewDate: string   // ISO date string
  totalReviews: number     // Lifetime review count
}

export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

export interface ReviewResult {
  card: SRSCard
  xpEarned: number
  wasCorrect: boolean
}

// ============================================================================
// SM-2 Algorithm
// ============================================================================

/**
 * Apply the SM-2 algorithm to calculate the next review schedule.
 */
export function calculateNextReview(card: SRSCard, quality: ReviewQuality): SRSCard {
  const today = getTodayString()
  let { easinessFactor, interval, repetitions } = card

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 6
    } else {
      interval = Math.round(interval * easinessFactor)
    }
    repetitions += 1
  } else {
    // Incorrect — reset to beginning
    repetitions = 0
    interval = 1
  }

  // Update easiness factor (EF)
  easinessFactor = easinessFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  if (easinessFactor < 1.3) easinessFactor = 1.3

  // Calculate next review date
  const nextDate = new Date()
  nextDate.setDate(nextDate.getDate() + interval)
  const nextReviewDate = nextDate.toISOString().split('T')[0]

  return {
    ...card,
    easinessFactor: Math.round(easinessFactor * 100) / 100,
    interval,
    repetitions,
    nextReviewDate,
    lastReviewDate: today,
    totalReviews: card.totalReviews + 1,
  }
}

/**
 * Create a new SRS card for a phrase that hasn't been reviewed yet.
 */
export function createNewCard(phraseId: string): SRSCard {
  return {
    phraseId,
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: getTodayString(),
    lastReviewDate: '',
    totalReviews: 0,
  }
}

/**
 * Map a simple correct/incorrect + difficulty to SM-2 quality rating.
 */
export function mapToQuality(correct: boolean, difficulty: 'easy' | 'medium' | 'hard'): ReviewQuality {
  if (!correct) return difficulty === 'hard' ? 0 : 1
  if (difficulty === 'easy') return 5
  if (difficulty === 'medium') return 4
  return 3
}

/**
 * Calculate XP earned from a review based on quality and streak.
 */
export function calculateReviewXP(quality: ReviewQuality, card: SRSCard): number {
  if (quality < 3) return 2  // Incorrect still earns participation XP
  const baseXP = 10
  const qualityBonus = (quality - 3) * 3  // 0, 3, or 6 bonus
  const streakBonus = Math.min(card.repetitions * 2, 10)  // Up to 10 bonus for long streaks
  return baseXP + qualityBonus + streakBonus
}

// ============================================================================
// Storage Operations
// ============================================================================

/**
 * Get all SRS cards from local storage.
 */
export async function getAllCards(): Promise<Record<string, SRSCard>> {
  const data = await AsyncStorage.getItem(SRS_STORAGE_KEY)
  return data ? JSON.parse(data) : {}
}

/**
 * Get or create an SRS card for a specific phrase.
 */
export async function getCard(phraseId: string): Promise<SRSCard> {
  const cards = await getAllCards()
  return cards[phraseId] || createNewCard(phraseId)
}

/**
 * Save an SRS card after review.
 */
export async function saveCard(card: SRSCard): Promise<void> {
  const cards = await getAllCards()
  cards[card.phraseId] = card
  await AsyncStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(cards))
}

/**
 * Process a review and update the card.
 */
export async function reviewPhrase(phraseId: string, quality: ReviewQuality): Promise<ReviewResult> {
  const card = await getCard(phraseId)
  const updated = calculateNextReview(card, quality)
  await saveCard(updated)
  return {
    card: updated,
    xpEarned: calculateReviewXP(quality, card),
    wasCorrect: quality >= 3,
  }
}

/**
 * Get all phrases due for review today (nextReviewDate <= today).
 */
export async function getDueCards(): Promise<SRSCard[]> {
  const cards = await getAllCards()
  const today = getTodayString()
  return Object.values(cards)
    .filter(card => card.nextReviewDate <= today && card.totalReviews > 0)
    .sort((a, b) => a.nextReviewDate.localeCompare(b.nextReviewDate))
}

/**
 * Get count of phrases due for review.
 */
export async function getDueCount(): Promise<number> {
  const due = await getDueCards()
  return due.length
}

/**
 * Get SRS statistics for the user.
 */
export async function getSRSStats(): Promise<{
  totalCards: number
  dueToday: number
  masteredCount: number
  averageEF: number
  totalReviews: number
}> {
  const cards = await getAllCards()
  const all = Object.values(cards)
  const today = getTodayString()

  if (all.length === 0) {
    return { totalCards: 0, dueToday: 0, masteredCount: 0, averageEF: 2.5, totalReviews: 0 }
  }

  const dueToday = all.filter(c => c.nextReviewDate <= today && c.totalReviews > 0).length
  const masteredCount = all.filter(c => c.interval >= 21 && c.repetitions >= 5).length
  const averageEF = all.reduce((sum, c) => sum + c.easinessFactor, 0) / all.length
  const totalReviews = all.reduce((sum, c) => sum + c.totalReviews, 0)

  return {
    totalCards: all.length,
    dueToday,
    masteredCount,
    averageEF: Math.round(averageEF * 100) / 100,
    totalReviews,
  }
}

// ============================================================================
// Helpers
// ============================================================================

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}
