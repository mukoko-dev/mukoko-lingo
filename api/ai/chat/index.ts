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

const log = createLogger('ai')

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

    const { messages, system_prompt, max_tokens, language, conversation_type } = req.body || {}
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    const result = await completeChat({
      messages,
      system: system_prompt || undefined,
      maxTokens: max_tokens || 1024,
      language,
      conversationType: conversation_type,
    })

    return res.status(200).json({
      data: { message: result.text, provider: result.provider, model: result.model },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })

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
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
