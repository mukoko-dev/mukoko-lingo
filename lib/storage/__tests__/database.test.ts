/**
 * Tests for database storage functions (web implementation via AsyncStorage)
 */
// Explicitly import the web implementation to avoid native SQLite resolver
import {
  initDatabase,
  addBookmark,
  removeBookmark,
  getBookmarks,
  isBookmarked,
  updateProgress,
  getProgress,
  updateUserSkill,
  getUserSkills,
  recordStudySession,
  getStudySessions,
  getStudyStreak,
  getDailyLesson,
  setDailyLesson,
  getDailyGoalProgress,
  updateDailyGoalProgress,
} from '../database.web'

const store: Record<string, string> = {}

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn((key: string) => Promise.resolve(store[key] || null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
      return Promise.resolve()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
      return Promise.resolve()
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
      return Promise.resolve()
    }),
  },
}))

describe('database (web)', () => {
  beforeEach(() => {
    Object.keys(store).forEach(key => delete store[key])
  })

  describe('initDatabase', () => {
    it('initializes without error', async () => {
      await expect(initDatabase()).resolves.not.toThrow()
    })
  })

  describe('bookmarks', () => {
    it('starts with empty bookmarks', async () => {
      const bookmarks = await getBookmarks()
      expect(bookmarks).toEqual([])
    })

    it('adds a bookmark', async () => {
      await addBookmark('phrase-1')
      const bookmarks = await getBookmarks()
      expect(bookmarks).toContain('phrase-1')
    })

    it('does not add duplicate bookmarks', async () => {
      await addBookmark('phrase-1')
      await addBookmark('phrase-1')
      const bookmarks = await getBookmarks()
      expect(bookmarks.filter(id => id === 'phrase-1').length).toBe(1)
    })

    it('removes a bookmark', async () => {
      await addBookmark('phrase-1')
      await addBookmark('phrase-2')
      await removeBookmark('phrase-1')
      const bookmarks = await getBookmarks()
      expect(bookmarks).not.toContain('phrase-1')
      expect(bookmarks).toContain('phrase-2')
    })

    it('checks if phrase is bookmarked', async () => {
      await addBookmark('phrase-1')
      expect(await isBookmarked('phrase-1')).toBe(true)
      expect(await isBookmarked('phrase-2')).toBe(false)
    })
  })

  describe('progress', () => {
    it('starts with empty progress', async () => {
      const progress = await getProgress()
      expect(progress).toEqual({})
    })

    it('updates progress for a phrase', async () => {
      await updateProgress('phrase-1', 'learning')
      const progress = await getProgress()
      expect(progress['phrase-1']).toBeDefined()
      expect(progress['phrase-1'].status).toBe('learning')
      expect(progress['phrase-1'].lastPracticed).toBeTruthy()
    })

    it('updates progress status', async () => {
      await updateProgress('phrase-1', 'learning')
      await updateProgress('phrase-1', 'mastered')
      const progress = await getProgress()
      expect(progress['phrase-1'].status).toBe('mastered')
    })

    it('tracks multiple phrases independently', async () => {
      await updateProgress('phrase-1', 'learning')
      await updateProgress('phrase-2', 'practiced')
      await updateProgress('phrase-3', 'mastered')
      const progress = await getProgress()
      expect(progress['phrase-1'].status).toBe('learning')
      expect(progress['phrase-2'].status).toBe('practiced')
      expect(progress['phrase-3'].status).toBe('mastered')
    })
  })

  describe('user skills', () => {
    it('starts with empty skills', async () => {
      const skills = await getUserSkills()
      expect(skills).toEqual({})
    })

    it('updates a user skill', async () => {
      await updateUserSkill('vocabulary', 75)
      const skills = await getUserSkills()
      expect(skills['vocabulary']).toBeDefined()
      expect(skills['vocabulary'].score).toBe(75)
      expect(skills['vocabulary'].lastAssessed).toBeTruthy()
    })

    it('updates skill score', async () => {
      await updateUserSkill('grammar', 50)
      await updateUserSkill('grammar', 85)
      const skills = await getUserSkills()
      expect(skills['grammar'].score).toBe(85)
    })

    it('tracks multiple skills', async () => {
      await updateUserSkill('vocabulary', 70)
      await updateUserSkill('grammar', 60)
      await updateUserSkill('pronunciation', 80)
      const skills = await getUserSkills()
      expect(Object.keys(skills).length).toBe(3)
      expect(skills['vocabulary'].score).toBe(70)
      expect(skills['grammar'].score).toBe(60)
      expect(skills['pronunciation'].score).toBe(80)
    })
  })

  describe('study sessions', () => {
    it('starts with empty sessions', async () => {
      const sessions = await getStudySessions()
      expect(sessions).toEqual([])
    })

    it('records a study session', async () => {
      await recordStudySession(5, 15)
      const sessions = await getStudySessions()
      expect(sessions.length).toBe(1)
      expect(sessions[0].phrasesPracticed).toBe(5)
      expect(sessions[0].durationMinutes).toBe(15)
      expect(sessions[0].date).toBeTruthy()
    })

    it('records multiple sessions', async () => {
      await recordStudySession(5, 15)
      await recordStudySession(10, 30)
      const sessions = await getStudySessions()
      expect(sessions.length).toBe(2)
    })
  })

  describe('study streak', () => {
    it('returns 0 with no sessions', async () => {
      const streak = await getStudyStreak()
      expect(streak).toBe(0)
    })

    it('returns 1 when studied today', async () => {
      await recordStudySession(5, 10)
      const streak = await getStudyStreak()
      expect(streak).toBe(1)
    })
  })

  describe('daily lessons', () => {
    it('returns null when no lesson is set for a date', async () => {
      const lesson = await getDailyLesson('2026-02-12')
      expect(lesson).toBeNull()
    })

    it('stores and retrieves a daily lesson', async () => {
      const phraseIds = ['phrase-1', 'phrase-2', 'phrase-3']
      await setDailyLesson('2026-02-12', phraseIds)
      const lesson = await getDailyLesson('2026-02-12')
      expect(lesson).toEqual(phraseIds)
    })

    it('keeps lessons separate by date', async () => {
      await setDailyLesson('2026-02-12', ['phrase-1', 'phrase-2'])
      await setDailyLesson('2026-02-13', ['phrase-3', 'phrase-4'])

      const lesson1 = await getDailyLesson('2026-02-12')
      const lesson2 = await getDailyLesson('2026-02-13')

      expect(lesson1).toEqual(['phrase-1', 'phrase-2'])
      expect(lesson2).toEqual(['phrase-3', 'phrase-4'])
    })

    it('overwrites a lesson for the same date', async () => {
      await setDailyLesson('2026-02-12', ['phrase-1'])
      await setDailyLesson('2026-02-12', ['phrase-5', 'phrase-6'])
      const lesson = await getDailyLesson('2026-02-12')
      expect(lesson).toEqual(['phrase-5', 'phrase-6'])
    })

    it('handles empty phrase array', async () => {
      await setDailyLesson('2026-02-12', [])
      const lesson = await getDailyLesson('2026-02-12')
      expect(lesson).toEqual([])
    })
  })

  describe('daily goal progress', () => {
    it('returns default progress when no data exists', async () => {
      const progress = await getDailyGoalProgress('2026-02-12')
      expect(progress).toEqual({ learned: 0, goal: 5, completed: false })
    })

    it('updates learned count', async () => {
      await updateDailyGoalProgress('2026-02-12', 3)
      const progress = await getDailyGoalProgress('2026-02-12')
      expect(progress.learned).toBe(3)
      expect(progress.goal).toBe(5)
      expect(progress.completed).toBe(false)
    })

    it('marks completed when learned reaches goal', async () => {
      await updateDailyGoalProgress('2026-02-12', 5)
      const progress = await getDailyGoalProgress('2026-02-12')
      expect(progress.learned).toBe(5)
      expect(progress.completed).toBe(true)
    })

    it('marks completed when learned exceeds goal', async () => {
      await updateDailyGoalProgress('2026-02-12', 7)
      const progress = await getDailyGoalProgress('2026-02-12')
      expect(progress.learned).toBe(7)
      expect(progress.completed).toBe(true)
    })

    it('keeps progress separate by date', async () => {
      await updateDailyGoalProgress('2026-02-12', 3)
      await updateDailyGoalProgress('2026-02-13', 1)

      const progress1 = await getDailyGoalProgress('2026-02-12')
      const progress2 = await getDailyGoalProgress('2026-02-13')

      expect(progress1.learned).toBe(3)
      expect(progress2.learned).toBe(1)
    })

    it('preserves goal value across updates', async () => {
      await updateDailyGoalProgress('2026-02-12', 1)
      await updateDailyGoalProgress('2026-02-12', 2)
      await updateDailyGoalProgress('2026-02-12', 3)

      const progress = await getDailyGoalProgress('2026-02-12')
      expect(progress.learned).toBe(3)
      expect(progress.goal).toBe(5)
    })

    it('transitions from not completed to completed correctly', async () => {
      await updateDailyGoalProgress('2026-02-12', 4)
      let progress = await getDailyGoalProgress('2026-02-12')
      expect(progress.completed).toBe(false)

      await updateDailyGoalProgress('2026-02-12', 5)
      progress = await getDailyGoalProgress('2026-02-12')
      expect(progress.completed).toBe(true)
    })
  })
})
