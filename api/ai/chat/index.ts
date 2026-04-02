/**
 * Server-side AI Chat Proxy
 *
 * Proxies chat requests to Anthropic Claude API so the API key stays
 * server-side. Includes rate limiting and circuit breaker.
 *
 * The client sends messages here instead of calling Anthropic directly.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY || ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const AI_MODEL = 'claude-haiku-4-5-20251001'

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

// ── Circuit Breaker (Anthropic API) ────────────────────────────────────────
// Registry standard: 3 failures, 5min cooldown, 15s timeout
const CIRCUIT_FAILURE_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000 // 5 minutes
const CIRCUIT_TIMEOUT_MS = 15 * 1000 // 15 seconds

let circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
let circuitFailureCount = 0
let circuitOpenedAt = 0

function isCircuitOpen(): boolean {
  if (circuitState === 'CLOSED') return false
  if (circuitState === 'OPEN') {
    if (Date.now() - circuitOpenedAt > CIRCUIT_COOLDOWN_MS) {
      circuitState = 'HALF_OPEN'
      return false // allow one probe request
    }
    return true
  }
  return false // HALF_OPEN allows one request
}

function recordSuccess(): void {
  circuitFailureCount = 0
  circuitState = 'CLOSED'
}

function recordFailure(): void {
  circuitFailureCount++
  if (circuitFailureCount >= CIRCUIT_FAILURE_THRESHOLD) {
    circuitState = 'OPEN'
    circuitOpenedAt = Date.now()
    console.error(`[mukoko][ai] Circuit breaker OPEN after ${circuitFailureCount} failures`)
  }
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  if (!ANTHROPIC_API_KEY) {
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

    // Circuit breaker check
    if (isCircuitOpen()) {
      return res.status(503).json({ error: 'AI service temporarily unavailable. Please try again in a few minutes.' })
    }

    const { messages, system_prompt, max_tokens } = req.body || {}
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    // Forward to Anthropic API
    const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        max_tokens: max_tokens || 1024,
        system: system_prompt || undefined,
        messages,
      }),
    }, CIRCUIT_TIMEOUT_MS)

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`[mukoko][ai] Anthropic API error: ${response.status} ${errorBody}`)
      recordFailure()

      if (response.status === 429) {
        return res.status(429).json({ error: 'AI service is busy. Please try again in a moment.' })
      }
      return res.status(502).json({ error: 'AI service error' })
    }

    recordSuccess()
    const data = await response.json()
    const content = data.content?.[0]?.text || ''

    return res.status(200).json({ data: { message: content } })
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[mukoko][ai] Anthropic API timeout')
      recordFailure()
      return res.status(504).json({ error: 'AI service timed out. Please try again.' })
    }
    recordFailure()
    console.error(`[mukoko][ai] Chat proxy error: ${error.message}`)
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
