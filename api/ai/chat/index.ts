/**
 * Server-side AI Chat Proxy
 *
 * Proxies chat requests to the AI providers so no API key reaches the client.
 * Provider selection, fallback and circuit breaking live in
 * `api/_lib/ai-provider.ts`; this route owns auth and per-user rate limiting.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { createLogger } from '../../_lib/logger'
import {
  completeChat,
  isAiConfigured,
  AiNotConfiguredError,
  AiUnavailableError,
} from '../../_lib/ai-provider'
import { moderateUserContent } from '../../_lib/moderation'
import { buildSystemPromptForUser } from '../../_lib/tutor-prompt'
import { sanitizeChatMessages, InvalidChatInputError } from '../../_lib/chat-input'

const log = createLogger('ai')

/**
 * `Math.min(n, 4096)` alone let a negative or fractional value through to the
 * provider, which answers with a 400 that surfaces as a 502.
 */
export function clampMaxTokens(raw: unknown): number {
  const n = Math.floor(Number(raw))
  if (!Number.isFinite(n) || n < 1) return 1024
  return Math.min(n, 4096)
}

// ── Rate Limiting (in-memory, per-user) ────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000 // 1 hour
const RATE_LIMIT_MAX = 30 // 30 requests per hour per user

const rateLimitMap = new Map<string, { count: number; windowStart: number }>()

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - entry.count }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!isAiConfigured()) {
    return res.status(503).json({ error: 'AI service not configured' })
  }

  try {
    const user = await requireAuth(req)

    // Rate limit check
    const { allowed, remaining } = checkRateLimit(user.personId)
    res.setHeader('X-RateLimit-Remaining', String(remaining))
    if (!allowed) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' })
    }

    // `system_prompt` is intentionally NOT read from the body. It used to be,
    // which let any caller replace the tutor framing and the safety guidance
    // wholesale. The prompt is built server-side from this user's stored
    // proficiency; the request only chooses a language and conversation type,
    // both mapped through allowlists.
    const { messages, max_tokens, language, conversation_type, proficiency } = req.body || {}

    const sanitizedMessages = sanitizeChatMessages(messages)

    // Moderate here, not just in the client. `lib/ai/moderation.ts` runs in the
    // caller's bundle, so it only protects users who go through our UI —
    // posting straight to this route skipped every guardrail.
    // Every turn, not just the latest. The whole history is client-supplied,
    // so payloads can sit in an earlier turn — or in a forged `assistant`
    // turn — and still reach the model. The guardrails are local regex checks,
    // so scanning the full array costs nothing extra.
    for (const message of sanitizedMessages) {
      const verdict = await moderateUserContent({
        personId: user.personId,
        content: message.content,
        contentType: message.role === 'user' ? 'chat_message' : 'chat_history',
      })
      if (verdict) {
        return res.status(400).json({
          error: verdict.reason || 'Message blocked by content guardrails',
          moderated: true,
          categories: verdict.categories,
        })
      }
    }

    const systemPrompt = await buildSystemPromptForUser({
      personId: user.personId,
      language,
      conversationType: conversation_type,
      clientScores: proficiency,
    })

    const result = await completeChat({
      messages: sanitizedMessages,
      system: systemPrompt,
      maxTokens: clampMaxTokens(max_tokens),
      language,
      conversationType: conversation_type,
    })

    return res.status(200).json({
      data: { message: result.text, provider: result.provider, model: result.model },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })

    if (error instanceof InvalidChatInputError) {
      return res.status(400).json({ error: error.message })
    }

    if (error instanceof AiNotConfiguredError) {
      return res.status(503).json({ error: 'AI service not configured' })
    }

    if (error instanceof AiUnavailableError) {
      if (error.status === 429) {
        return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' })
      }
      if (error.status === 504) {
        return res.status(504).json({ error: 'AI service timed out. Please try again.' })
      }
      if (error.status === 503) {
        return res
          .status(503)
          .json({ error: 'AI service temporarily unavailable. Please try again in a few minutes.' })
      }
      return res.status(502).json({ error: 'AI service error' })
    }

    log.error(`Chat proxy error: ${error.message}`)
    // Generic body: raw exception text leaks driver internals, collection and
    // field names, and connection strings to any caller who can trigger one.
    return res.status(500).json({ error: 'Internal server error' })
  }
}
