/**
 * Tests for Spaced Repetition System (SM-2 Algorithm)
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

import {
  calculateNextReview,
  createNewCard,
  mapToQuality,
  calculateReviewXP,
  type SRSCard,
  type ReviewQuality,
} from '../srs'

describe('SRS - SM-2 Algorithm', () => {
  const baseCard: SRSCard = {
    phraseId: 'test-phrase-1',
    easinessFactor: 2.5,
    interval: 0,
    repetitions: 0,
    nextReviewDate: '2026-04-08',
    lastReviewDate: '',
    totalReviews: 0,
  }

  describe('createNewCard', () => {
    it('creates a card with default SM-2 values', () => {
      const card = createNewCard('phrase-123')
      expect(card.phraseId).toBe('phrase-123')
      expect(card.easinessFactor).toBe(2.5)
      expect(card.interval).toBe(0)
      expect(card.repetitions).toBe(0)
      expect(card.totalReviews).toBe(0)
    })
  })

  describe('calculateNextReview', () => {
    it('sets interval to 1 day on first correct answer', () => {
      const result = calculateNextReview(baseCard, 4)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
      expect(result.totalReviews).toBe(1)
    })

    it('sets interval to 6 days on second correct answer', () => {
      const afterFirst = calculateNextReview(baseCard, 4)
      const result = calculateNextReview(afterFirst, 4)
      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('multiplies interval by EF on subsequent correct answers', () => {
      let card = baseCard
      // First 3 correct answers
      card = calculateNextReview(card, 5) // interval=1
      card = calculateNextReview(card, 5) // interval=6
      card = calculateNextReview(card, 5) // interval=6*EF

      expect(card.interval).toBeGreaterThan(6)
      expect(card.repetitions).toBe(3)
    })

    it('resets to interval 1 on incorrect answer', () => {
      // Build up a streak
      let card = calculateNextReview(baseCard, 5)
      card = calculateNextReview(card, 5)
      card = calculateNextReview(card, 5)

      expect(card.repetitions).toBe(3)

      // Fail
      const failed = calculateNextReview(card, 2)
      expect(failed.interval).toBe(1)
      expect(failed.repetitions).toBe(0)
    })

    it('decreases easiness factor on low quality answers', () => {
      const result = calculateNextReview(baseCard, 3)
      expect(result.easinessFactor).toBeLessThan(2.5)
    })

    it('increases easiness factor on high quality answers', () => {
      const result = calculateNextReview(baseCard, 5)
      expect(result.easinessFactor).toBeGreaterThan(2.5)
    })

    it('never lets easiness factor drop below 1.3', () => {
      let card = baseCard
      // Repeatedly give lowest passing score
      for (let i = 0; i < 20; i++) {
        card = calculateNextReview(card, 3)
      }
      expect(card.easinessFactor).toBeGreaterThanOrEqual(1.3)
    })

    it('increments totalReviews regardless of quality', () => {
      const correct = calculateNextReview(baseCard, 5)
      expect(correct.totalReviews).toBe(1)

      const incorrect = calculateNextReview(baseCard, 1)
      expect(incorrect.totalReviews).toBe(1)
    })
  })

  describe('mapToQuality', () => {
    it('maps correct+easy to quality 5', () => {
      expect(mapToQuality(true, 'easy')).toBe(5)
    })

    it('maps correct+medium to quality 4', () => {
      expect(mapToQuality(true, 'medium')).toBe(4)
    })

    it('maps correct+hard to quality 3', () => {
      expect(mapToQuality(true, 'hard')).toBe(3)
    })

    it('maps incorrect to quality 0 or 1', () => {
      expect(mapToQuality(false, 'hard')).toBe(0)
      expect(mapToQuality(false, 'medium')).toBe(1)
    })
  })

  describe('calculateReviewXP', () => {
    it('awards base XP for correct answers', () => {
      const xp = calculateReviewXP(3, baseCard)
      expect(xp).toBe(10) // Base only, no quality bonus
    })

    it('awards bonus XP for high quality', () => {
      const xp5 = calculateReviewXP(5, baseCard)
      const xp3 = calculateReviewXP(3, baseCard)
      expect(xp5).toBeGreaterThan(xp3)
    })

    it('awards participation XP for incorrect answers', () => {
      const xp = calculateReviewXP(1, baseCard)
      expect(xp).toBe(2)
    })

    it('gives streak bonus for long repetition chains', () => {
      const longStreak = { ...baseCard, repetitions: 5 }
      const noStreak = { ...baseCard, repetitions: 0 }
      const xpLong = calculateReviewXP(4, longStreak)
      const xpShort = calculateReviewXP(4, noStreak)
      expect(xpLong).toBeGreaterThan(xpShort)
    })
  })
})
