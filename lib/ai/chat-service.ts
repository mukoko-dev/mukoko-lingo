/**
 * AI Chat Service for React Native
 * Handles communication with Anthropic Claude API for Shamwari chatbot
 */

import { buildSkillsAwarePrompt } from './skills-aware-prompts'
import { moderateContent, getModerationMessage } from './moderation'

// Anthropic API configuration
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const AI_MODEL = 'claude-haiku-4-5-20251001'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
}

export interface ChatResponse {
  message: string
  error?: string
}

/**
 * Send a message to the AI tutor via Anthropic Claude API
 */
export async function sendMessage(
  messages: ChatMessage[],
  language: string = 'Shona',
  conversationType: 'practice' | 'scenario' | 'translation_help' = 'practice'
): Promise<ChatResponse> {
  try {
    // Moderate user message before processing
    const lastUserMessage = messages[messages.length - 1]?.content || ''
    if (lastUserMessage) {
      const modResult = await moderateContent(lastUserMessage)
      if (modResult.flagged) {
        return {
          message: getModerationMessage(modResult),
          error: 'content_moderated',
        }
      }
    }

    // Build skills-aware system prompt
    const systemPrompt = await buildSkillsAwarePrompt(conversationType, language)

    // If no API key configured, use simulated response
    if (!ANTHROPIC_API_KEY) {
      console.warn('[chat-service] No EXPO_PUBLIC_ANTHROPIC_API_KEY set, using simulated responses')
      return simulateResponse(messages[messages.length - 1]?.content || '')
    }

    // Format messages for Anthropic API (filter out system messages, keep user/assistant)
    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[chat-service] API error:', response.status, errorBody)
      throw new Error(`Anthropic API error: ${response.status}`)
    }

    const data = await response.json()

    // Extract text from Anthropic's response format
    const content = data.content?.[0]?.text || ''

    if (!content) {
      throw new Error('Empty response from Anthropic API')
    }

    return { message: content }
  } catch (error) {
    console.error('[chat-service] Error:', error)

    // If API call fails, fall back to simulated response
    if (ANTHROPIC_API_KEY) {
      return {
        message: "I'm having trouble connecting right now. Please check your internet connection and try again!",
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    return simulateResponse(messages[messages.length - 1]?.content || '')
  }
}

/**
 * Simulate AI response for offline/demo mode (when no API key is set)
 */
function simulateResponse(userMessage: string): ChatResponse {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      message: "Mhoro! \u{1F41D} (That's 'hello' in Shona!) I'm Shamwari, your friendly language tutor. I'm here to help you learn Shona, Ndebele, Swahili, and Chinese. What would you like to learn today?",
    }
  }

  if (lowerMessage.includes('thank')) {
    return {
      message: "Maita basa! (Thank you in Shona!) \u{1F41D} You're doing great, friend! Keep up the excellent work on your language learning journey!",
    }
  }

  if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going")) {
    return {
      message: "Ndiripo! (I am well in Shona!) Thank you for asking! \u{1F41D}\n\nIn Shona, you can say 'Makadii?' to ask 'How are you?' The response would be 'Ndiripo' meaning 'I am well'.\n\nWould you like to practice this greeting exchange?",
    }
  }

  if (lowerMessage.includes('shona') || lowerMessage.includes('zimbabwe')) {
    return {
      message: "Great choice! Shona (chiShona) is a beautiful Bantu language spoken by about 80% of Zimbabwe's population. \u{1F41D}\n\nLet's start with some essential phrases:\n\n\u2022 Mhoro - Hello\n\u2022 Maita basa - Thank you\n\u2022 Ndapota - Please\n\u2022 Ndinonzi... - My name is...\n\nWhich phrase would you like to practice first?",
    }
  }

  if (lowerMessage.includes('ndebele')) {
    return {
      message: "Wonderful! Ndebele (isiNdebele) is spoken in Zimbabwe and South Africa. \u{1F41D}\n\nHere are some essential Ndebele phrases:\n\n\u2022 Sawubona - Hello\n\u2022 Ngiyabonga - Thank you\n\u2022 Ngicela - Please\n\u2022 Ibizo lami ngu... - My name is...\n\nWould you like me to help you with pronunciation?",
    }
  }

  if (lowerMessage.includes('swahili') || lowerMessage.includes('kiswahili')) {
    return {
      message: "Karibu! (Welcome in Swahili!) Swahili is one of Africa's most widely spoken languages. \u{1F41D}\n\nLet's learn some basics:\n\n\u2022 Jambo/Habari - Hello\n\u2022 Asante - Thank you\n\u2022 Tafadhali - Please\n\u2022 Jina langu ni... - My name is...\n\nSwahili is known for being relatively easy to learn. Which phrase interests you?",
    }
  }

  if (lowerMessage.includes('chinese') || lowerMessage.includes('mandarin')) {
    return {
      message: "\u597D\u7684! (H\u01CEo de - Great!) Chinese is a fascinating language with a rich history. \u{1F41D}\n\nLet's start with essentials:\n\n\u2022 \u4F60\u597D (N\u01D0 h\u01CEo) - Hello\n\u2022 \u8C22\u8C22 (Xi\u00E8xi\u00E8) - Thank you\n\u2022 \u8BF7 (Q\u01D0ng) - Please\n\u2022 \u6211\u53EB... (W\u01D2 ji\u00E0o...) - My name is...\n\nWould you like help with the tones?",
    }
  }

  return {
    message: "That's a great question! \u{1F41D} As Shamwari, your language learning friend, I'm here to help you learn Shona, Ndebele, Swahili, and Chinese.\n\nYou can ask me to:\n\u2022 Teach you new phrases\n\u2022 Practice conversations\n\u2022 Explain grammar concepts\n\u2022 Help with pronunciation\n\u2022 Share cultural context\n\nWhat would you like to explore?",
  }
}

/**
 * Get conversation starters based on language
 */
export function getConversationStarters(language: string): string[] {
  const starters: Record<string, string[]> = {
    Shona: [
      'How do I say "Hello" in Shona?',
      'Teach me basic greetings',
      'How do I introduce myself?',
      'What are common phrases for shopping?',
    ],
    Ndebele: [
      'How do I say "Thank you" in Ndebele?',
      'Teach me Ndebele greetings',
      'How do I ask for directions?',
      'What phrases do I need for ordering food?',
    ],
    Swahili: [
      'How do I say "Welcome" in Swahili?',
      'Teach me numbers in Swahili',
      'How do I ask "How much?"',
      'What are essential travel phrases?',
    ],
    Chinese: [
      'How do I say "Hello" in Chinese?',
      'Teach me Chinese tones',
      'How do I count in Chinese?',
      'What are polite expressions?',
    ],
  }

  return starters[language] || starters.Shona
}
