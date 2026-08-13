/**
 * AI provider routing with fallback.
 *
 * Two independent transports, each with its own credential and wire format:
 *
 *   anthropic  ANTHROPIC_API_KEY   → api.anthropic.com/v1/messages   (x-api-key,
 *                                    Anthropic Messages shape)
 *   gateway    AI_GATEWAY_API_KEY  → ai-gateway.vercel.sh/v1/chat/completions
 *                                    (Authorization: Bearer, OpenAI shape)
 *
 * These are NOT interchangeable credentials. The routes used to do
 * `ANTHROPIC_API_KEY || AI_GATEWAY_API_KEY` and then POST to Anthropic with
 * `x-api-key` either way, so a gateway-only deployment sent a gateway key to
 * Anthropic and got a 401 on every request. Each key now only ever reaches the
 * transport it belongs to.
 *
 * Routing: Chinese practice and translate-to-English run better on Kimi, so
 * those requests try Kimi (via the gateway) first. Everything else leads with
 * Claude Haiku direct. Either way the remaining candidates act as fallbacks,
 * so a single provider outage degrades rather than fails.
 */

import { createLogger } from './logger'

const log = createLogger('ai')

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''
const AI_GATEWAY_API_KEY = process.env.AI_GATEWAY_API_KEY || ''

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const GATEWAY_API_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions'

/** Direct Anthropic model id (Messages API). */
export const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001'
/** Same model reached through the gateway — gateway ids are `provider/model`. */
export const GATEWAY_CLAUDE_MODEL = 'anthropic/claude-haiku-4.5'
/** Kimi K2.5: strong Mandarin and zh↔en translation, cheap enough for chat. */
export const GATEWAY_KIMI_MODEL = 'moonshotai/kimi-k2.5'

const REQUEST_TIMEOUT_MS = 15 * 1000

export type ProviderId = 'anthropic' | 'gateway'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  messages: ChatTurn[]
  system?: string
  maxTokens?: number
  /**
   * Target learning language and conversation type, used only to pick a
   * candidate order. Both optional — omitted means the default order.
   */
  language?: string
  conversationType?: string
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

/** Every candidate provider failed. `status` is the best HTTP status to surface. */
export class AiUnavailableError extends Error {
  status: number
  constructor(message: string, status = 502) {
    super(message)
    this.name = 'AiUnavailableError'
    this.status = status
  }
}

interface Candidate {
  provider: ProviderId
  model: string
}

const CANDIDATES: Record<ProviderId, (model: string) => boolean> = {
  anthropic: () => Boolean(ANTHROPIC_API_KEY),
  gateway: () => Boolean(AI_GATEWAY_API_KEY),
}

/**
 * True when the request is Chinese practice or a translation request — the
 * cases the user asked to route to Kimi.
 */
export function prefersKimi(language?: string, conversationType?: string): boolean {
  const lang = (language || '').toLowerCase()
  if (lang.includes('chinese') || lang.includes('mandarin') || lang.startsWith('zh')) return true
  return conversationType === 'translation_help'
}

/** Candidate providers in preference order, filtered to configured credentials. */
export function resolveCandidates(language?: string, conversationType?: string): Candidate[] {
  const kimi: Candidate = { provider: 'gateway', model: GATEWAY_KIMI_MODEL }
  const claudeDirect: Candidate = { provider: 'anthropic', model: ANTHROPIC_MODEL }
  const claudeGateway: Candidate = { provider: 'gateway', model: GATEWAY_CLAUDE_MODEL }

  const ordered = prefersKimi(language, conversationType)
    ? [kimi, claudeDirect, claudeGateway]
    : [claudeDirect, claudeGateway, kimi]

  return ordered.filter((c) => CANDIDATES[c.provider](c.model))
}

export function isAiConfigured(): boolean {
  return Boolean(ANTHROPIC_API_KEY || AI_GATEWAY_API_KEY)
}

// ── Circuit breaker, one per candidate ─────────────────────────────────────
// Keyed by `provider:model` so Kimi tripping doesn't take Claude down with it.
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

async function callAnthropic(req: ChatRequest, model: string): Promise<string> {
  const response = await fetchWithTimeout(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens || 1024,
      system: req.system || undefined,
      messages: req.messages,
    }),
  })

  if (!response.ok) {
    throw await httpError('anthropic', model, response)
  }

  const data: any = await response.json()
  return data?.content?.[0]?.text || ''
}

async function callGateway(req: ChatRequest, model: string): Promise<string> {
  // OpenAI-compatible shape: the system prompt is a leading message, not a
  // top-level field.
  const messages = req.system
    ? [{ role: 'system', content: req.system }, ...req.messages]
    : req.messages

  const response = await fetchWithTimeout(GATEWAY_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: req.maxTokens || 1024,
      messages,
    }),
  })

  if (!response.ok) {
    throw await httpError('gateway', model, response)
  }

  const data: any = await response.json()
  return data?.choices?.[0]?.message?.content || ''
}

async function httpError(provider: ProviderId, model: string, response: Response): Promise<AiUnavailableError> {
  const body = await response.text().catch(() => '')
  log.error(`${provider} (${model}) responded ${response.status}: ${body.slice(0, 500)}`)
  return new AiUnavailableError(`${provider} error ${response.status}`, response.status)
}

/**
 * Run the request against each configured candidate in order, returning the
 * first success.
 *
 * Throws `AiNotConfiguredError` when nothing is configured (a 503 for the
 * caller) and `AiUnavailableError` when every candidate failed. Callers must
 * not conflate the two — the moderation route in particular has to know the
 * difference between "AI moderation is off" and "AI moderation broke".
 */
export async function completeChat(req: ChatRequest): Promise<ChatResult> {
  const candidates = resolveCandidates(req.language, req.conversationType)
  if (candidates.length === 0) throw new AiNotConfiguredError()

  let lastError: AiUnavailableError | null = null
  let sawOpenCircuit = false

  for (const candidate of candidates) {
    const key = `${candidate.provider}:${candidate.model}`
    if (isCircuitOpen(key)) {
      sawOpenCircuit = true
      continue
    }

    try {
      const text =
        candidate.provider === 'anthropic'
          ? await callAnthropic(req, candidate.model)
          : await callGateway(req, candidate.model)

      recordSuccess(key)
      return { text, provider: candidate.provider, model: candidate.model }
    } catch (error: any) {
      recordFailure(key)
      if (error?.name === 'AbortError') {
        log.error(`${key} timed out after ${REQUEST_TIMEOUT_MS}ms`)
        lastError = new AiUnavailableError('AI request timed out', 504)
      } else if (error instanceof AiUnavailableError) {
        lastError = error
      } else {
        log.error(`${key} threw: ${error?.message || error}`)
        lastError = new AiUnavailableError(error?.message || 'AI request failed', 502)
      }
    }
  }

  if (lastError) throw lastError
  if (sawOpenCircuit) throw new AiUnavailableError('AI service temporarily unavailable', 503)
  throw new AiUnavailableError('AI request failed')
}
