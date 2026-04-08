/**
 * Tests for XP & Gamification System
 */

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

import { calculateLevel, xpRequiredForLevel, getLevelInfo, XP_AMOUNTS } from '../xp'

describe('XP System', () => {
  describe('calculateLevel', () => {
    it('starts at level 1 with 0 XP', () => {
      expect(calculateLevel(0)).toBe(1)
    })

    it('reaches level 2 at 100 XP', () => {
      expect(calculateLevel(100)).toBe(2)
    })

    it('reaches level 3 at 400 XP', () => {
      expect(calculateLevel(400)).toBe(3)
    })

    it('reaches level 5 at 1600 XP', () => {
      expect(calculateLevel(1600)).toBe(5)
    })

    it('reaches level 10 at 8100 XP', () => {
      expect(calculateLevel(8100)).toBe(10)
    })

    it('handles mid-level XP correctly', () => {
      // 250 XP is between level 2 (100) and level 3 (400)
      expect(calculateLevel(250)).toBe(2)
    })
  })

  describe('xpRequiredForLevel', () => {
    it('requires 0 XP for level 1', () => {
      expect(xpRequiredForLevel(1)).toBe(0)
    })

    it('requires 100 XP for level 2', () => {
      expect(xpRequiredForLevel(2)).toBe(100)
    })

    it('requires 400 XP for level 3', () => {
      expect(xpRequiredForLevel(3)).toBe(400)
    })

    it('scales quadratically', () => {
      const l5 = xpRequiredForLevel(5)
      const l10 = xpRequiredForLevel(10)
      expect(l10).toBeGreaterThan(l5 * 2)
    })
  })

  describe('getLevelInfo', () => {
    it('returns level 1 info for 0 XP', () => {
      const info = getLevelInfo(0)
      expect(info.level).toBe(1)
      expect(info.currentXP).toBe(0)
      expect(info.progressPercent).toBe(0)
      expect(info.title).toBe('Seedling')
    })

    it('calculates progress within a level', () => {
      // Level 2 starts at 100, level 3 at 400
      const info = getLevelInfo(250)
      expect(info.level).toBe(2)
      expect(info.progressPercent).toBe(50)
    })

    it('assigns appropriate titles', () => {
      expect(getLevelInfo(0).title).toBe('Seedling')
      expect(getLevelInfo(100).title).toBe('Sprout')
      expect(getLevelInfo(8100).title).toBe('Baobab')
    })

    it('includes XP thresholds for current and next level', () => {
      const info = getLevelInfo(500)
      expect(info.xpForCurrentLevel).toBe(400)  // Level 3
      expect(info.xpForNextLevel).toBe(900)      // Level 4
    })
  })

  describe('XP_AMOUNTS', () => {
    it('has defined amounts for all XP sources', () => {
      expect(XP_AMOUNTS.phrase_learned).toBe(10)
      expect(XP_AMOUNTS.quiz_correct).toBe(15)
      expect(XP_AMOUNTS.quiz_perfect).toBe(25)
      expect(XP_AMOUNTS.srs_review).toBe(10)
      expect(XP_AMOUNTS.ai_chat).toBe(5)
      expect(XP_AMOUNTS.assessment_completed).toBe(50)
      expect(XP_AMOUNTS.assessment_passed).toBe(100)
      expect(XP_AMOUNTS.daily_goal_bonus).toBe(30)
      expect(XP_AMOUNTS.streak_milestone).toBe(50)
    })

    it('rewards harder activities more', () => {
      expect(XP_AMOUNTS.assessment_passed).toBeGreaterThan(XP_AMOUNTS.phrase_learned)
      expect(XP_AMOUNTS.quiz_perfect).toBeGreaterThan(XP_AMOUNTS.quiz_correct)
    })
  })
})
