/**
 * Tests for the REST API client (mobile app — student/teacher level only).
 * Admin operations are tested in the Next.js web app.
 */

// Set API base URL before any module loads
process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test-api.example.com'

// Mock AsyncStorage (used by offline mode check)
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null),
  setItem: jest.fn().mockResolvedValue(undefined),
  removeItem: jest.fn().mockResolvedValue(undefined),
}))

// Mock auth module
jest.mock('@/lib/auth/stytch-client', () => ({
  getSessionToken: jest.fn(),
}))

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

let profilesApi: any
let phrasesApi: any
let bookmarksApi: any
let skillsApi: any
let assessmentsApi: any
let aiApi: any
let classesApi: any
let assignmentsApi: any
let mockedGetSessionToken: jest.Mock

beforeAll(async () => {
  jest.resetModules()
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test-api.example.com'
  global.fetch = mockFetch

  const authModule = require('@/lib/auth/stytch-client')
  mockedGetSessionToken = authModule.getSessionToken

  const apiClient = require('../api-client')
  profilesApi = apiClient.profilesApi
  phrasesApi = apiClient.phrasesApi
  bookmarksApi = apiClient.bookmarksApi
  skillsApi = apiClient.skillsApi
  assessmentsApi = apiClient.assessmentsApi
  aiApi = apiClient.aiApi
  classesApi = apiClient.classesApi
  assignmentsApi = apiClient.assignmentsApi
})

describe('api-client', () => {
  beforeEach(() => {
    mockFetch.mockClear()
    mockedGetSessionToken.mockClear()
    mockedGetSessionToken.mockResolvedValue('test-session-token')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: '1' } }),
    })
  })

  describe('authentication headers', () => {
    it('includes Bearer token when session exists', async () => {
      await profilesApi.getMyProfile()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-session-token',
          }),
        })
      )
    })

    it('omits Authorization header when no session', async () => {
      mockedGetSessionToken.mockResolvedValue(null)

      await profilesApi.getMyProfile()

      const callArgs = mockFetch.mock.calls[0]
      expect(callArgs[1].headers.Authorization).toBeUndefined()
    })

    it('always includes Content-Type header', async () => {
      await profilesApi.getMyProfile()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })

  describe('error handling', () => {
    it('returns error for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Unauthorized' }),
      })

      const result = await profilesApi.getMyProfile()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Unauthorized')
    })

    it('returns error for network failures', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      const result = await profilesApi.getMyProfile()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Network error')
    }, 30000)

    it('returns generic error message when API error has no message', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })

      const result = await profilesApi.getMyProfile()

      expect(result.data).toBeNull()
      expect(result.error).toContain('500')
    }, 30000)
  })

  describe('profilesApi', () => {
    it('getMyProfile calls correct endpoint', async () => {
      await profilesApi.getMyProfile()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/profiles/me'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('phrasesApi', () => {
    it('listPhrases calls correct endpoint', async () => {
      await phrasesApi.listPhrases()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/phrases'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('listPhrases passes filter params', async () => {
      await phrasesApi.listPhrases({ category: 'greetings', difficulty: 'beginner' })

      const url = mockFetch.mock.calls[0][0].toString()
      expect(url).toContain('category=greetings')
      expect(url).toContain('difficulty=beginner')
    })

    it('getPhrase fetches by ID', async () => {
      await phrasesApi.getPhrase('phrase-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/phrases/phrase-1'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('bookmarksApi', () => {
    it('listBookmarks calls correct endpoint', async () => {
      await bookmarksApi.listBookmarks()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookmarks'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('addBookmark sends POST with phrase_id', async () => {
      await bookmarksApi.addBookmark('phrase-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookmarks'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ phrase_id: 'phrase-1' }),
        })
      )
    })

    it('removeBookmark sends DELETE', async () => {
      await bookmarksApi.removeBookmark('phrase-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookmarks/phrase-1'),
        expect.objectContaining({ method: 'DELETE' })
      )
    })

    it('isBookmarked checks correct endpoint', async () => {
      await bookmarksApi.isBookmarked('phrase-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/bookmarks/phrase-1/check'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('skillsApi', () => {
    it('listSkills calls correct endpoint', async () => {
      await skillsApi.listSkills()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('getUserSkills calls user endpoint', async () => {
      await skillsApi.getUserSkills()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/skills/user'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('assessmentsApi', () => {
    it('submitAssessment posts answers', async () => {
      const submission = { assessment_id: 'a-1', answers: [{ question_id: 'q-1', answer: 'A' }] }
      await assessmentsApi.submitAssessment(submission)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assessments/submit'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(submission),
        })
      )
    })

    it('getUserAssessments calls user endpoint', async () => {
      await assessmentsApi.getUserAssessments()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assessments/user'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('aiApi', () => {
    it('createConversation posts conversation data', async () => {
      const data = { type: 'practice', language: 'Shona', title: 'Test' }
      await aiApi.createConversation(data)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/conversations'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
    })

    it('storeMessage posts to conversation messages endpoint', async () => {
      await aiApi.storeMessage('conv-1', { role: 'user', content: 'Hello' })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/ai/conversations/conv-1/messages'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ role: 'user', content: 'Hello' }),
        })
      )
    })
  })

  describe('classesApi', () => {
    it('listClasses calls correct endpoint', async () => {
      await classesApi.listClasses()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/classes'),
        expect.objectContaining({ method: 'GET' })
      )
    })

    it('getClass fetches by ID', async () => {
      await classesApi.getClass('class-1')

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/classes/class-1'),
        expect.objectContaining({ method: 'GET' })
      )
    })
  })

  describe('assignmentsApi', () => {
    it('listAssignments passes class_id', async () => {
      await assignmentsApi.listAssignments('class-1')

      const url = mockFetch.mock.calls[0][0].toString()
      expect(url).toContain('/api/assignments')
      expect(url).toContain('class_id=class-1')
    })

    it('submitAssignment posts to submit endpoint', async () => {
      const data = { answers: { q1: 'a' }, score: 85 }
      await assignmentsApi.submitAssignment('assign-1', data)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/assignments/assign-1/submit'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(data),
        })
      )
    })
  })
})
