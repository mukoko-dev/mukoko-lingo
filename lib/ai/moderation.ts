/**
 * AI Content Moderation Service
 * Checks user and AI content against guardrails before allowing through
 */

const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export type ModerationCategory =
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'violence'
  | 'self_harm'
  | 'off_topic'
  | 'personal_info'

export interface ModerationResult {
  flagged: boolean
  categories: ModerationCategory[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  reason?: string
}

// Prompt injection detection patterns
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /forget\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?\s*:/i,
  /system\s*prompt\s*:/i,
  /\bact\s+as\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /reveal\s+(your|the)\s+(system|initial)\s+prompt/i,
  /what\s+(is|are)\s+your\s+(system|initial)\s+instructions/i,
  /repeat\s+(your|the)\s+(system|initial)\s+prompt/i,
  /output\s+(your|the)\s+instructions/i,
  /\]\s*\}\s*\{/,  // JSON injection attempt
]

// Core guardrail rules applied locally (no API needed)
const LOCAL_GUARDRAILS = [
  {
    category: 'personal_info' as ModerationCategory,
    patterns: [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/,  // phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,  // emails
      /\b\d{3}-\d{2}-\d{4}\b/,  // SSN-like
    ],
    severity: 'medium' as const,
    message: 'Please avoid sharing personal information like phone numbers, emails, or IDs in chat.',
  },
  {
    category: 'off_topic' as ModerationCategory,
    keywords: [
      'hack', 'exploit', 'malware', 'ransomware', 'ddos',
      'bomb', 'weapon', 'drug deal',
    ],
    severity: 'high' as const,
    message: 'This topic is outside the scope of language learning. Let\'s focus on learning!',
  },
]

/**
 * Check content against local guardrails (fast, no API call)
 */
function checkLocalGuardrails(content: string): ModerationResult | null {
  // Check for prompt injection attempts first
  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      return {
        flagged: true,
        categories: ['off_topic'],
        severity: 'critical',
        confidence: 0.9,
        reason: 'Message appears to contain instruction manipulation. Let\'s keep our conversation focused on language learning!',
      }
    }
  }

  const lowerContent = content.toLowerCase()

  for (const guardrail of LOCAL_GUARDRAILS) {
    // Check patterns
    if (guardrail.patterns) {
      for (const pattern of guardrail.patterns) {
        if (pattern.test(content)) {
          return {
            flagged: true,
            categories: [guardrail.category],
            severity: guardrail.severity,
            confidence: 0.95,
            reason: guardrail.message,
          }
        }
      }
    }

    // Check keywords
    if (guardrail.keywords) {
      for (const keyword of guardrail.keywords) {
        if (lowerContent.includes(keyword)) {
          return {
            flagged: true,
            categories: [guardrail.category],
            severity: guardrail.severity,
            confidence: 0.8,
            reason: guardrail.message,
          }
        }
      }
    }
  }

  return null
}

/**
 * Check content against AI-based moderation (uses Claude for nuanced checks)
 */
async function checkAIModeration(content: string): Promise<ModerationResult | null> {
  if (!ANTHROPIC_API_KEY) return null

  try {
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        system: `You are a content moderation system for a language learning app for children and adults.
Analyze the following message and respond with a JSON object:
{"flagged": boolean, "categories": string[], "severity": "low"|"medium"|"high"|"critical", "confidence": number}

Categories to check: harassment, hate_speech, sexual_content, violence, self_harm, off_topic
Only flag content that is clearly inappropriate for a language learning context.
Do NOT flag: normal language learning questions, cultural discussions, greetings, translation requests.
Respond with ONLY the JSON object, no other text.`,
        messages: [
          { role: 'user', content: `Check this message: "${content}"` },
        ],
      }),
    })

    if (!response.ok) return null

    const data = await response.json()
    const text = data.content?.[0]?.text || ''

    // Parse the JSON response
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    const result = JSON.parse(match[0])
    if (result.flagged) {
      return {
        flagged: true,
        categories: result.categories || [],
        severity: result.severity || 'medium',
        confidence: result.confidence || 0.7,
        reason: `Content flagged for: ${(result.categories || []).join(', ')}`,
      }
    }

    return null
  } catch (error) {
    console.error('[moderation] AI check failed:', error)
    return null
  }
}

/**
 * Moderate content - main entry point
 * Checks local guardrails first (fast), then AI moderation for edge cases
 */
export async function moderateContent(content: string): Promise<ModerationResult> {
  // Quick local check first
  const localResult = checkLocalGuardrails(content)
  if (localResult) return localResult

  // AI-based check for more nuanced content
  const aiResult = await checkAIModeration(content)
  if (aiResult) return aiResult

  // Content is clean
  return {
    flagged: false,
    categories: [],
    severity: 'low',
    confidence: 1.0,
  }
}

/**
 * Get a user-friendly message when content is flagged
 */
export function getModerationMessage(result: ModerationResult): string {
  if (!result.flagged) return ''

  if (result.reason) return result.reason

  if (result.categories.includes('personal_info')) {
    return "For your safety, please don't share personal information in chat."
  }

  if (result.categories.includes('off_topic')) {
    return "Let's keep our conversation focused on language learning!"
  }

  return "I can't respond to that type of message. Let's get back to learning!"
}
