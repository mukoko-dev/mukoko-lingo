import { moderateContent, getModerationMessage } from '../moderation'

// Mock fetch for AI moderation tests
global.fetch = jest.fn()

describe('moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Default: no API key, so AI moderation is skipped
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = ''
  })

  describe('moderateContent', () => {
    it('flags phone numbers as personal info', async () => {
      const result = await moderateContent('Call me at 555-123-4567')
      expect(result.flagged).toBe(true)
      expect(result.categories).toContain('personal_info')
      expect(result.severity).toBe('medium')
    })

    it('flags email addresses as personal info', async () => {
      const result = await moderateContent('Email me at test@example.com')
      expect(result.flagged).toBe(true)
      expect(result.categories).toContain('personal_info')
    })

    it('flags SSN-like patterns as personal info', async () => {
      const result = await moderateContent('My SSN is 123-45-6789')
      expect(result.flagged).toBe(true)
      expect(result.categories).toContain('personal_info')
    })

    it('flags off-topic keywords', async () => {
      const result = await moderateContent('How do I hack into something?')
      expect(result.flagged).toBe(true)
      expect(result.categories).toContain('off_topic')
      expect(result.severity).toBe('high')
    })

    it('flags malware keyword', async () => {
      const result = await moderateContent('Tell me about malware')
      expect(result.flagged).toBe(true)
      expect(result.categories).toContain('off_topic')
    })

    it('does not flag normal language learning content', async () => {
      const result = await moderateContent('How do I say hello in Shona?')
      expect(result.flagged).toBe(false)
      expect(result.categories).toEqual([])
    })

    it('does not flag greeting messages', async () => {
      const result = await moderateContent('Hi! I want to learn Ndebele')
      expect(result.flagged).toBe(false)
    })

    it('does not flag cultural discussion', async () => {
      const result = await moderateContent('What is the Ubuntu philosophy in African cultures?')
      expect(result.flagged).toBe(false)
    })

    it('returns clean result with high confidence for safe content', async () => {
      const result = await moderateContent('Teach me greetings in Swahili')
      expect(result.flagged).toBe(false)
      expect(result.confidence).toBe(1.0)
      expect(result.severity).toBe('low')
    })
  })

  describe('getModerationMessage', () => {
    it('returns empty string for non-flagged results', () => {
      const msg = getModerationMessage({
        flagged: false,
        categories: [],
        severity: 'low',
        confidence: 1.0,
      })
      expect(msg).toBe('')
    })

    it('returns reason when provided', () => {
      const msg = getModerationMessage({
        flagged: true,
        categories: ['off_topic'],
        severity: 'high',
        confidence: 0.9,
        reason: 'Custom reason message',
      })
      expect(msg).toBe('Custom reason message')
    })

    it('returns personal info message', () => {
      const msg = getModerationMessage({
        flagged: true,
        categories: ['personal_info'],
        severity: 'medium',
        confidence: 0.9,
      })
      expect(msg).toContain('personal information')
    })

    it('returns off-topic message', () => {
      const msg = getModerationMessage({
        flagged: true,
        categories: ['off_topic'],
        severity: 'high',
        confidence: 0.8,
      })
      expect(msg).toContain('language learning')
    })

    it('returns generic message for other categories', () => {
      const msg = getModerationMessage({
        flagged: true,
        categories: ['harassment'],
        severity: 'high',
        confidence: 0.9,
      })
      expect(msg).toContain('learning')
    })
  })
})
