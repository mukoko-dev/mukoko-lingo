/**
 * AI provider transport.
 *
 * One provider: Cloudflare Workers AI, reached through Cloudflare AI Gateway.
 *
 *   https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions
 *   Authorization: Bearer {CLOUDFLARE_API_TOKEN}
 *   cf-aig-gateway-id: {CLOUDFLARE_AI_GATEWAY_ID}
 *
 * The endpoint is OpenAI-compatible, so the system prompt travels as a leading
 * `system` message rather than a top-level field, and the answer comes back on
 * `choices[0].message.content`.
 *
 * This used to be two transports — Anthropic direct (`x-api-key`, Messages
 * shape) plus the Vercel AI Gateway (`Bearer`, OpenAI shape) with Kimi for
 * Chinese and translation. Neither is used any more: inference is Workers AI,
 * so both credentials, both wire formats and the per-language candidate
 * ordering are gone. `language`/`conversationType` no longer reach this module
 * at all — they only ever chose a candidate order, and there is one candidate.
 *
 * The circuit breaker stays. With no second provider to fall back to it no
 * longer protects a sibling candidate; it fails fast during an outage instead
 * of making every learner wait out the 15s timeout.
 */

import { createLogger } from './logger'

const log = createLogger('ai')

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ''
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ''
/** AI Gateway to route through. Unset = straight to Workers AI, no gateway. */
const CLOUDFLARE_AI_GATEWAY_ID = process.env.CLOUDFLARE_AI_GATEWAY_ID || ''
/** Only needed when the gateway is set to "authenticated". */
const CLOUDFLARE_AI_GATEWAY_TOKEN = process.env.CLOUDFLARE_AI_GATEWAY_TOKEN || ''

/**
 * Qwen3 30B A3B (FP8) — a mixture-of-experts model that activates ~3B
 * parameters per pass, so it answers a tutor turn quickly and handles the
 * multilingual load (Shona, Ndebele, Chinese) the app is built around.
 * Overridable so a model swap is a deploy variable, not a code change.
 */
export const WORKERS_AI_MODEL = process.env.WORKERS_AI_MODEL || '@cf/qwen/qwen3-30b-a3b-fp8'

const REQUEST_TIMEOUT_MS = 15 * 1000

export type ProviderId = 'workers-ai'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatTurn[]
  system?: string
  maxTokens?: number
}

export interface ChatResult {
  text: string
  provider: ProviderId
  model: string
}

/** No usable credential is configured — a deployment problem, not an outage. */
export class AiNotConfiguredError extends Error {
  constructor() {
    super('AI service not configured')
    this.name = 'AiNotConfiguredError'
  }
}

/** The provider call failed. `status` is the best HTTP status to surface. */
export class AiUnavailableError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'AiUnavailableError'
    this.status = status
  }
}

/** Both halves are required: the account scopes the URL, the token signs it. */
export function isAiConfigured(): boolean {
  return Boolean(CLOUDFLARE_ACCOUNT_ID && CLOUDFLARE_API_TOKEN)
}

export function workersAiUrl(): string {
  return `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/v1/chat/completions`
}

// ── Circuit breaker ────────────────────────────────────────────────────────
// Keyed by model so an override (WORKERS_AI_MODEL) starts with a clean breaker
// rather than inheriting the failures of the model it replaced.
const CIRCUIT_FAILURE_THRESHOLD = 3
const CIRCUIT_COOLDOWN_MS = 5 * 60 * 1000

interface Circuit {
  failures: number
  openedAt: number
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN'
}

const circuits = new Map<string, Circuit>()

function circuitFor(key: string): Circuit {
  let c = circuits.get(key)
  if (!c) {
    c = { failures: 0, openedAt: 0, state: 'CLOSED' }
    circuits.set(key, c)
  }
  return c
}

function isCircuitOpen(key: string): boolean {
  const c = circuitFor(key)
  if (c.state !== 'OPEN') return false
  if (Date.now() - c.openedAt > CIRCUIT_COOLDOWN_MS) {
    c.state = 'HALF_OPEN' // allow a single probe through
    return false
  }
  return true
}

function recordSuccess(key: string): void {
  const c = circuitFor(key)
  c.failures = 0
  c.state = 'CLOSED'
}

function recordFailure(key: string): void {
  const c = circuitFor(key)
  c.failures++
  if (c.failures >= CIRCUIT_FAILURE_THRESHOLD) {
    c.state = 'OPEN'
    c.openedAt = Date.now()
    log.error(`Circuit breaker OPEN for ${key} after ${c.failures} failures`)
  }
}

/** Test seam — the breakers are module-level state shared across invocations. */
export function resetCircuits(): void {
  circuits.clear()
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  }
  // Without this header the request still reaches Workers AI, it just bypasses
  // the gateway (no caching, no per-gateway rate limits, no request log).
  if (CLOUDFLARE_AI_GATEWAY_ID) headers['cf-aig-gateway-id'] = CLOUDFLARE_AI_GATEWAY_ID
  if (CLOUDFLARE_AI_GATEWAY_TOKEN) {
    headers['cf-aig-authorization'] = `Bearer ${CLOUDFLARE_AI_GATEWAY_TOKEN}`
  }
  return headers
}

async function callWorkersAi(req: ChatRequest, model: string): Promise<string> {
  // OpenAI-compatible shape: the system prompt is a leading message, not a
  // top-level field.
  const messages = req.system
    ? [{ role: 'system', content: req.system }, ...req.messages]
    : req.messages

  const response = await fetchWithTimeout(workersAiUrl(), {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens || 1024,
      messages,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    log.error(`workers-ai (${model}) responded ${response.status}: ${body.slice(0, 500)}`)
    throw new AiUnavailableError(`workers-ai error ${response.status}`, response.status)
  }

  const data: any = await response.json()
  return data?.choices?.[0]?.message?.content || ''
}

/**
 * Run the request against Workers AI.
 *
 * Throws `AiNotConfiguredError` when no credential is set (a 503 for the
 * caller) and `AiUnavailableError` when the call failed. Callers must not
 * conflate the two — the moderation route in particular has to know the
 * difference between "AI moderation is off" and "AI moderation broke".
 */
export async function completeChat(req: ChatRequest): Promise<ChatResult> {
  if (!isAiConfigured()) throw new AiNotConfiguredError()

  const model = WORKERS_AI_MODEL
  const key = `workers-ai:${model}`
  if (isCircuitOpen(key)) {
    throw new AiUnavailableError('AI service temporarily unavailable', 503)
  }

  try {
    const text = await callWorkersAi(req, model)
    recordSuccess(key)
    return { text, provider: 'workers-ai', model }
  } catch (error: any) {
    recordFailure(key)
    if (error?.name === 'AbortError') {
      log.error(`${key} timed out after ${REQUEST_TIMEOUT_MS}ms`)
      throw new AiUnavailableError('AI request timed out', 504)
    }
    if (error instanceof AiUnavailableError) throw error
    log.error(`${key} threw: ${error?.message || error}`)
    throw new AiUnavailableError(error?.message || 'AI request failed', 502)
  }
}
