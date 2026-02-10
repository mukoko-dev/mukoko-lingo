import { sendMessage, getConversationStarters, ChatMessage } from '../chat-service'

// Mock fetch
global.fetch = jest.fn()

// Mock moderation to always pass
jest.mock('../moderation', () => ({
  moderateContent: jest.fn().mockResolvedValue({ flagged: false, categories: [], severity: 'low', confidence: 1.0 }),
  getModerationMessage: jest.fn().mockReturnValue(''),
}))

// Mock skills-aware prompts
jest.mock('../skills-aware-prompts', () => ({
  buildSkillsAwarePrompt: jest.fn().mockResolvedValue('You are Shamwari, a language tutor.'),
}))

describe('chat-service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY = ''
  })

  describe('sendMessage (simulated mode)', () => {
    it('responds to hello greetings', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'Hello!', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Mhoro')
      expect(response.error).toBeUndefined()
    })

    it('responds to thank you', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'Thank you so much!', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Maita basa')
    })

    it('responds to how are you', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'How are you?', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Ndiripo')
    })

    it('responds to Shona queries', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'Tell me about Shona language', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Shona')
      expect(response.message).toContain('Mhoro')
    })

    it('responds to Ndebele queries', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'I want to learn Ndebele', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Ndebele')
      expect(response.message).toContain('Sawubona')
    })

    it('responds to Swahili queries', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'Teach me Swahili', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Swahili')
    })

    it('responds to Chinese queries', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'I want to learn Chinese', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toContain('Chinese')
    })

    it('returns generic helpful response for unknown input', async () => {
      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'random question here', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.message).toBeTruthy()
      expect(response.message.length).toBeGreaterThan(10)
    })
  })

  describe('sendMessage (moderated content)', () => {
    it('returns moderation message when content is flagged', async () => {
      const { moderateContent } = require('../moderation')
      moderateContent.mockResolvedValueOnce({
        flagged: true,
        categories: ['off_topic'],
        severity: 'high',
        confidence: 0.9,
        reason: 'Off topic content detected',
      })

      const { getModerationMessage } = require('../moderation')
      getModerationMessage.mockReturnValueOnce('Off topic content detected')

      const messages: ChatMessage[] = [
        { id: '1', role: 'user', content: 'something flagged', timestamp: new Date() },
      ]
      const response = await sendMessage(messages)
      expect(response.error).toBe('content_moderated')
      expect(response.message).toBe('Off topic content detected')
    })
  })

  describe('getConversationStarters', () => {
    it('returns starters for Shona', () => {
      const starters = getConversationStarters('Shona')
      expect(starters.length).toBeGreaterThan(0)
      expect(starters).toEqual(expect.arrayContaining([
        expect.stringContaining('Shona'),
      ]))
    })

    it('returns starters for Ndebele', () => {
      const starters = getConversationStarters('Ndebele')
      expect(starters.length).toBeGreaterThan(0)
      expect(starters).toEqual(expect.arrayContaining([
        expect.stringContaining('Ndebele'),
      ]))
    })

    it('returns starters for Swahili', () => {
      const starters = getConversationStarters('Swahili')
      expect(starters.length).toBeGreaterThan(0)
    })

    it('returns starters for Chinese', () => {
      const starters = getConversationStarters('Chinese')
      expect(starters.length).toBeGreaterThan(0)
    })

    it('falls back to Shona for unknown language', () => {
      const starters = getConversationStarters('French')
      const shonaStarters = getConversationStarters('Shona')
      expect(starters).toEqual(shonaStarters)
    })
  })
})
