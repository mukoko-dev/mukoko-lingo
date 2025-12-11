/**
 * AI Chat Service for React Native
 * Handles communication with AI backend for Shamwari chatbot
 */

import { buildSkillsAwarePrompt } from './skills-aware-prompts'

// You'll need to configure your API endpoint
const AI_API_ENDPOINT = process.env.EXPO_PUBLIC_AI_API_ENDPOINT || ''

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
 * Send a message to the AI tutor
 */
export async function sendMessage(
  messages: ChatMessage[],
  language: string = 'Shona',
  conversationType: 'practice' | 'scenario' | 'translation_help' = 'practice'
): Promise<ChatResponse> {
  try {
    // Build skills-aware system prompt
    const systemPrompt = await buildSkillsAwarePrompt(conversationType, language)

    // If no API endpoint configured, use simulated response
    if (!AI_API_ENDPOINT) {
      return simulateResponse(messages[messages.length - 1]?.content || '')
    }

    const response = await fetch(AI_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content })),
        ],
        language,
        conversationType,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get AI response')
    }

    const data = await response.json()
    return { message: data.message || data.content }
  } catch (error) {
    console.error('[chat-service] Error:', error)
    return {
      message: "I'm having trouble connecting right now. Please try again in a moment!",
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Simulate AI response for offline/demo mode
 */
function simulateResponse(userMessage: string): ChatResponse {
  const lowerMessage = userMessage.toLowerCase()

  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return {
      message: "Mhoro! 🐝 (That's 'hello' in Shona!) I'm Shamwari, your friendly language tutor. I'm here to help you learn Shona, Ndebele, Swahili, and Chinese. What would you like to learn today?",
    }
  }

  // Thank you responses
  if (lowerMessage.includes('thank')) {
    return {
      message: "Maita basa! (Thank you in Shona!) 🐝 You're doing great, friend! Keep up the excellent work on your language learning journey!",
    }
  }

  // How are you
  if (lowerMessage.includes('how are you') || lowerMessage.includes("how's it going")) {
    return {
      message: "Ndiripo! (I am well in Shona!) Thank you for asking! 🐝\n\nIn Shona, you can say 'Makadii?' to ask 'How are you?' The response would be 'Ndiripo' meaning 'I am well'.\n\nWould you like to practice this greeting exchange?",
    }
  }

  // Learning Shona
  if (lowerMessage.includes('shona') || lowerMessage.includes('zimbabwe')) {
    return {
      message: "Great choice! Shona (chiShona) is a beautiful Bantu language spoken by about 80% of Zimbabwe's population. 🐝\n\nLet's start with some essential phrases:\n\n• Mhoro - Hello\n• Maita basa - Thank you\n• Ndapota - Please\n• Ndinonzi... - My name is...\n\nWhich phrase would you like to practice first?",
    }
  }

  // Learning Ndebele
  if (lowerMessage.includes('ndebele')) {
    return {
      message: "Wonderful! Ndebele (isiNdebele) is spoken in Zimbabwe and South Africa. 🐝\n\nHere are some essential Ndebele phrases:\n\n• Sawubona - Hello\n• Ngiyabonga - Thank you\n• Ngicela - Please\n• Ibizo lami ngu... - My name is...\n\nWould you like me to help you with pronunciation?",
    }
  }

  // Learning Swahili
  if (lowerMessage.includes('swahili') || lowerMessage.includes('kiswahili')) {
    return {
      message: "Karibu! (Welcome in Swahili!) Swahili is one of Africa's most widely spoken languages. 🐝\n\nLet's learn some basics:\n\n• Jambo/Habari - Hello\n• Asante - Thank you\n• Tafadhali - Please\n• Jina langu ni... - My name is...\n\nSwahili is known for being relatively easy to learn. Which phrase interests you?",
    }
  }

  // Learning Chinese
  if (lowerMessage.includes('chinese') || lowerMessage.includes('mandarin') || lowerMessage.includes('中文')) {
    return {
      message: "好的! (Hǎo de - Great!) Chinese is a fascinating language with a rich history. 🐝\n\nLet's start with essentials:\n\n• 你好 (Nǐ hǎo) - Hello\n• 谢谢 (Xièxiè) - Thank you\n• 请 (Qǐng) - Please\n• 我叫... (Wǒ jiào...) - My name is...\n\nWould you like help with the tones?",
    }
  }

  // Ubuntu philosophy
  if (lowerMessage.includes('ubuntu')) {
    return {
      message: "Ubuntu is a beautiful African philosophy that means 'I am because we are'. 🐝\n\nIt emphasizes our interconnectedness and shared humanity. In language learning, Ubuntu reminds us that:\n\n• We learn better together\n• Every learner's progress enriches the community\n• Helping others helps ourselves grow\n\nThis is why at Nyuchi Lingo, we believe in community-based learning!",
    }
  }

  // Default response
  return {
    message: "That's a great question! 🐝 As Shamwari, your language learning friend, I'm here to help you learn Shona, Ndebele, Swahili, and Chinese.\n\nYou can ask me to:\n• Teach you new phrases\n• Practice conversations\n• Explain grammar concepts\n• Help with pronunciation\n• Share cultural context\n\nWhat would you like to explore?",
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
