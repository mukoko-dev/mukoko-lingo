/**
 * Content guardrail rules, shared by the client pre-check and the server.
 *
 * These live apart from `lib/ai/moderation.ts` because that module reaches for
 * the API base URL, which pulls in React Native's Platform and so cannot be
 * imported by a Vercel serverless function. Keeping the rules here lets the
 * server enforce exactly what the client checks, instead of the two drifting.
 */

export type ModerationCategory =
  | 'harassment'
  | 'hate_speech'
  | 'sexual_content'
  | 'violence'
  | 'self_harm'
  | 'off_topic'
  | 'personal_info'

export interface GuardrailVerdict {
  flagged: boolean
  categories: ModerationCategory[]
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  reason?: string
}

// Prompt injection detection patterns
export const PROMPT_INJECTION_PATTERNS = [
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
export const LOCAL_GUARDRAILS = [
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
 * Check content against the local guardrails. Returns null when nothing
 * matched — the caller decides what a clean result means.
 */
export function evaluateGuardrails(content: string): GuardrailVerdict | null {
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
