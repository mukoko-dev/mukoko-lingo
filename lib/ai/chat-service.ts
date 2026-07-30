/**
 * AI Chat Service for React Native
 * Handles communication with Shamwari AI tutor via server-side proxy.
 *
 * The Anthropic API key is server-side only. The client sends messages
 * to /api/ai/chat which proxies to Claude with rate limiting and
 * circuit breaker protection.
 */

import { buildSkillsAwarePrompt } from './skills-aware-prompts'
import { moderateContent, getModerationMessage } from './moderation'
import { getSessionToken } from '@/lib/auth/workos-client'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || ''

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
 * Send a message to the AI tutor via server-side proxy
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

    // If no API URL configured, use simulated response (offline/demo mode)
    if (!API_BASE_URL) {
      console.warn('[mukoko][chat] No API_BASE_URL set, using simulated responses')
      return simulateResponse(messages[messages.length - 1]?.content || '')
    }

    // Format messages for the API proxy (filter out system messages)
    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    // Get auth token
    const token = await getSessionToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    // Call server-side proxy (API key is server-side only)
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages: apiMessages,
        system_prompt: systemPrompt,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      const errorMsg = errorData.error || `Server error: ${response.status}`
      console.error(`[mukoko][chat] API error: ${response.status} ${errorMsg}`)

      if (response.status === 429) {
        return {
          message: "I need a quick break! You've been learning hard. Please try again in a few minutes.",
          error: 'rate_limited',
        }
      }
      if (response.status === 503) {
        return {
          message: "I'm having a brief nap. Please try again in a moment!",
          error: 'service_unavailable',
        }
      }
      throw new Error(errorMsg)
    }

    const data = await response.json()
    const content = data.data?.message || ''

    if (!content) {
      throw new Error('Empty response from AI service')
    }

    return { message: content }
  } catch (error) {
    console.error('[mukoko][chat] Error:', error)

    return {
      message: "I'm having trouble connecting right now. Please check your internet connection and try again!",
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Simulate AI response for offline/demo mode (when no API is available)
 */
function simulateResponse(userMessage: string): ChatResponse {
  const lowerMessage = userMessage.toLowerCase()

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      message: "Mhoro! (That's 'hello' in Shona!) I'm Shamwari, your friendly language tutor. Welcome to the hive — I'm here to help you learn Shona, Ndebele, Swahili, and Chinese. What would you like to learn today?",
    }
  }

  if (lowerMessage.includes('thank')) {
    return {
      message: "Maita basa! (Thank you in Shona!) You're doing great, friend! The hive grows stronger every day with your learning!",
    }
  }

  if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going")) {
    return {
      message: "Ndiripo! (I am well in Shona!) Thank you for asking!\n\nIn Shona, you can say 'Makadii?' to ask 'How are you?' The response would be 'Ndiripo' meaning 'I am well'.\n\nWould you like to practice this greeting exchange?",
    }
  }

  if (lowerMessage.includes('shona') || lowerMessage.includes('zimbabwe')) {
    return {
      message: "Great choice! Shona (chiShona) is a beautiful Bantu language spoken by about 80% of Zimbabwe's population.\n\nLet's start with some essential phrases:\n\n\u2022 Mhoro - Hello\n\u2022 Maita basa - Thank you\n\u2022 Ndapota - Please\n\u2022 Ndinonzi... - My name is...\n\nWhich phrase would you like to practice first?",
    }
  }

  if (lowerMessage.includes('ndebele')) {
    return {
      message: "Wonderful! Ndebele (isiNdebele) is spoken in Zimbabwe and South Africa.\n\nHere are some essential Ndebele phrases:\n\n\u2022 Sawubona - Hello\n\u2022 Ngiyabonga - Thank you\n\u2022 Ngicela - Please\n\u2022 Ibizo lami ngu... - My name is...\n\nWould you like me to help you with pronunciation?",
    }
  }

  if (lowerMessage.includes('swahili') || lowerMessage.includes('kiswahili')) {
    return {
      message: "Karibu! (Welcome in Swahili!) Swahili is one of Africa's most widely spoken languages.\n\nLet's learn some basics:\n\n\u2022 Jambo/Habari - Hello\n\u2022 Asante - Thank you\n\u2022 Tafadhali - Please\n\u2022 Jina langu ni... - My name is...\n\nSwahili is known for being relatively easy to learn. Which phrase interests you?",
    }
  }

  if (lowerMessage.includes('chinese') || lowerMessage.includes('mandarin')) {
    return {
      message: "\u597D\u7684! (H\u01CEo de - Great!) Chinese is a fascinating language with a rich history.\n\nLet's start with essentials:\n\n\u2022 \u4F60\u597D (N\u01D0 h\u01CEo) - Hello\n\u2022 \u8C22\u8C22 (Xi\u00E8xi\u00E8) - Thank you\n\u2022 \u8BF7 (Q\u01D0ng) - Please\n\u2022 \u6211\u53EB... (W\u01D2 ji\u00E0o...) - My name is...\n\nWould you like help with the tones?",
    }
  }

  return {
    message: "That's a great question! As Shamwari, your language learning friend, I'm here to help you learn Shona, Ndebele, Swahili, and Chinese.\n\nYou can ask me to:\n\u2022 Teach you new phrases\n\u2022 Practice conversations\n\u2022 Explain grammar concepts\n\u2022 Help with pronunciation\n\u2022 Share cultural context\n\nWhat would you like to explore?",
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
