/**
 * Tests for daily-lesson service
 */

// Mock the database module before any imports
const mockDailyLessons: Record<string, string[]> = {}
const mockGoalProgress: Record<string, { learned: number }> = {}

jest.mock('@/lib/storage/database', () => ({
  getProgress: jest.fn(() => Promise.resolve({})),
  getUserSkills: jest.fn(() => Promise.resolve({})),
  getDailyLesson: jest.fn((date: string) => Promise.resolve(mockDailyLessons[date] || null)),
  setDailyLesson: jest.fn((date: string, ids: string[]) => {
    mockDailyLessons[date] = ids
    return Promise.resolve()
  }),
  getDailyGoalProgress: jest.fn((date: string) => {
    const progress = mockGoalProgress[date]
    const learned = progress ? progress.learned : 0
    return Promise.resolve({ learned, goal: 5, completed: learned >= 5 })
  }),
  updateDailyGoalProgress: jest.fn((date: string, learned: number) => {
    mockGoalProgress[date] = { learned }
    return Promise.resolve()
  }),
  updateProgress: jest.fn(() => Promise.resolve()),
  updateUserSkill: jest.fn(() => Promise.resolve()),
}))

import {
  getSkillForCategory,
  getTodaysLesson,
  getTodayProgress,
  markPhraseLearned,
  generateQuizQuestions,
} from '../daily-lesson'
import { phrases } from '@/lib/data/phrases-data'

describe('daily-lesson service', () => {
  beforeEach(() => {
    Object.keys(mockDailyLessons).forEach(key => delete mockDailyLessons[key])
    Object.keys(mockGoalProgress).forEach(key => delete mockGoalProgress[key])
    jest.clearAllMocks()
  })

  describe('getSkillForCategory', () => {
    it('maps greetings to conversation', () => {
      expect(getSkillForCategory('greetings')).toBe('conversation')
    })

    it('maps family to vocabulary', () => {
      expect(getSkillForCategory('family')).toBe('vocabulary')
    })

    it('maps directions to comprehension', () => {
      expect(getSkillForCategory('directions')).toBe('comprehension')
    })

    it('maps school to grammar', () => {
      expect(getSkillForCategory('school')).toBe('grammar')
    })

    it('maps emotions to conversation', () => {
      expect(getSkillForCategory('emotions')).toBe('conversation')
    })

    it('maps shopping to conversation', () => {
      expect(getSkillForCategory('shopping')).toBe('conversation')
    })

    it('maps transport to comprehension', () => {
      expect(getSkillForCategory('transport')).toBe('comprehension')
    })

    it('defaults unknown categories to vocabulary', () => {
      expect(getSkillForCategory('unknown')).toBe('vocabulary')
      expect(getSkillForCategory('')).toBe('vocabulary')
    })
  })

  describe('getTodaysLesson', () => {
    it('returns 5 phrases for daily lesson', async () => {
      const lesson = await getTodaysLesson()
      expect(lesson).toHaveLength(5)
    })

    it('returns valid Phrase objects', async () => {
      const lesson = await getTodaysLesson()
      lesson.forEach(phrase => {
        expect(phrase).toHaveProperty('id')
        expect(phrase).toHaveProperty('english')
        expect(phrase).toHaveProperty('shona')
        expect(phrase).toHaveProperty('category')
      })
    })

    it('caches lesson for the day', async () => {
      const firstCall = await getTodaysLesson()
      const secondCall = await getTodaysLesson()
      expect(firstCall.map(p => p.id).sort()).toEqual(secondCall.map(p => p.id).sort())
    })

    it('returns unique phrases (no duplicates)', async () => {
      const lesson = await getTodaysLesson()
      const ids = lesson.map(p => p.id)
      expect(new Set(ids).size).toBe(ids.length)
    })
  })

  describe('getTodayProgress', () => {
    it('returns default progress when no data', async () => {
      const progress = await getTodayProgress()
      expect(progress).toEqual({ learned: 0, goal: 5, completed: false })
    })
  })

  describe('markPhraseLearned', () => {
    it('increments learned count', async () => {
      const result = await markPhraseLearned()
      expect(result.learned).toBe(1)
      expect(result.goal).toBe(5)
      expect(result.completed).toBe(false)
    })

    it('tracks justCompleted when goal is reached', async () => {
      for (let i = 0; i < 4; i++) {
        await markPhraseLearned()
      }
      const result = await markPhraseLearned()
      expect(result.learned).toBe(5)
      expect(result.completed).toBe(true)
      expect(result.justCompleted).toBe(true)
    })

    it('does not set justCompleted after already completed', async () => {
      for (let i = 0; i < 5; i++) {
        await markPhraseLearned()
      }
      const result = await markPhraseLearned()
      expect(result.learned).toBe(6)
      expect(result.completed).toBe(true)
      expect(result.justCompleted).toBe(false)
    })
  })

  describe('generateQuizQuestions', () => {
    const testPhrases = phrases.slice(0, 3)

    it('generates questions for each phrase', () => {
      const questions = generateQuizQuestions(testPhrases, 'shona')
      expect(questions).toHaveLength(3)
    })

    it('includes correct answer in options', () => {
      const questions = generateQuizQuestions(testPhrases, 'shona')
      questions.forEach(q => {
        expect(q.options).toContain(q.correctAnswer)
      })
    })

    it('generates 3 options per question', () => {
      const questions = generateQuizQuestions(testPhrases, 'shona')
      questions.forEach(q => {
        expect(q.options).toHaveLength(3)
      })
    })

    it('includes phrase id and english text', () => {
      const questions = generateQuizQuestions(testPhrases, 'shona')
      questions.forEach((q, i) => {
        expect(q.phraseId).toBe(testPhrases[i].id)
        expect(q.english).toBe(testPhrases[i].english)
      })
    })

    it('works with ndebele language', () => {
      const questions = generateQuizQuestions(testPhrases, 'ndebele')
      questions.forEach(q => {
        expect(q.correctAnswer).toBeTruthy()
        expect(q.options.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('works with chinese language', () => {
      const questions = generateQuizQuestions(testPhrases, 'chinese')
      questions.forEach(q => {
        expect(q.correctAnswer).toBeTruthy()
      })
    })
  })
})
