/**
 * AI Content Moderation Service
 * Checks user and AI content against guardrails before allowing through
 */

// AI moderation uses the server-side proxy when available, falls back to local-only
import { getApiBaseUrl } from '@/lib/config/api-base'

export type {
  ModerationCategory,
  GuardrailVerdict,
} from './guardrail-rules'

import type { ModerationCategory, GuardrailVerdict } from './guardrail-rules'
import { evaluateGuardrails } from './guardrail-rules'

/**
 * Result of a moderation pass. Structurally identical to the shared
 * `GuardrailVerdict` — kept as its own exported name because callers across
 * the app import `ModerationResult`.
 */
export type ModerationResult = GuardrailVerdict

/**
 * Check content against local guardrails (fast, no API call).
 *
 * The rules themselves live in `./guardrail-rules` so the server can apply the
 * same ones — a check that only runs in the client bundle is a check an
 * attacker can simply skip by calling the API directly.
 */
function checkLocalGuardrails(content: string): ModerationResult | null {
  return evaluateGuardrails(content)
}

/**
 * Check content against AI-based moderation (uses Claude for nuanced checks)
 */
async function checkAIModeration(content: string): Promise<ModerationResult | null> {
  // AI moderation is handled server-side via the chat proxy.
  // The local guardrails + prompt injection detection handle client-side checks.
  if (!getApiBaseUrl()) return null

  try {
    const { getSessionToken } = await import('@/lib/auth/workos-client')
    const token = await getSessionToken()
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const response = await fetch(`${getApiBaseUrl()}/api/ai/moderate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      console.warn(`[mukoko][moderation] AI check unavailable: ${response.status}`)
      return null
    }

    // The route returns `{ data: { flagged, categories, severity, confidence,
    // ai_checked } }`. This used to read `data.content[0].text` — the raw
    // Anthropic shape, which the route never returned — so every AI check
    // silently resolved to null and only local guardrails ever ran.
    const result = (await response.json())?.data
    if (!result) return null

    if (result.ai_checked === false) {
      console.warn(`[mukoko][moderation] AI check did not run: ${result.reason || 'unknown'}`)
      return null
    }

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
