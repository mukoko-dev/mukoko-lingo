/**
 * Server-side AI Content Moderation
 *
 * Runs a nuanced second-pass check on top of the client's local guardrails.
 * Provider selection and fallback live in `api/_lib/ai-provider.ts`.
 *
 * The response always carries `ai_checked`. Previously any failure — a bad key,
 * a 500, unparseable output — returned a bare `{flagged: false}`, so a broken
 * moderation provider was indistinguishable from clean content and everything
 * silently passed. Now "the model said this is fine" and "the model never ran"
 * are different payloads, and the failure case is logged.
 *
 * Default posture is still fail-open (a moderation outage shouldn't take chat
 * down for learners); set AI_MODERATION_FAIL_CLOSED=true to return 503 instead
 * and have the client block the message.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'
import { createLogger } from '../_lib/logger'
import { completeChat, isAiConfigured, AiNotConfiguredError } from '../_lib/ai-provider'

const log = createLogger('moderation')

const FAIL_CLOSED = process.env.AI_MODERATION_FAIL_CLOSED === 'true'

const MODERATION_SYSTEM_PROMPT = `You are a content moderation system for a language learning app for children and adults.
Analyze the following message and respond with a JSON object:
{"flagged": boolean, "categories": string[], "severity": "low"|"medium"|"high"|"critical", "confidence": number}

Categories to check: harassment, hate_speech, sexual_content, violence, self_harm, off_topic
Only flag content that is clearly inappropriate for a language learning context.
Do NOT flag: normal language learning questions, cultural discussions, greetings, translation requests.
Respond with ONLY the JSON object, no other text.`

function unchecked(reason: string) {
  return { flagged: false, categories: [], severity: 'low', confidence: 0, ai_checked: false, reason }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAuth(req)

    const { content } = req.body || {}
    if (!content) return res.status(400).json({ error: 'content is required' })

    if (!isAiConfigured()) {
      // Deliberate configuration state, not a failure: local guardrails only.
      return res.status(200).json({ data: unchecked('not_configured') })
    }

    let text: string
    try {
      const result = await completeChat({
        messages: [{ role: 'user', content: `Check this message: ${JSON.stringify(content)}` }],
        system: MODERATION_SYSTEM_PROMPT,
        maxTokens: 256,
      })
      text = result.text
    } catch (error: any) {
      if (error instanceof AiNotConfiguredError) {
        return res.status(200).json({ data: unchecked('not_configured') })
      }
      log.error(`AI moderation unavailable: ${error?.message || error}`)
      if (FAIL_CLOSED) {
        return res.status(503).json({ error: 'Moderation unavailable' })
      }
      return res.status(200).json({ data: unchecked('provider_error') })
    }

    // The model is told to return bare JSON, but tolerate it wrapping the
    // object in prose.
    const match = typeof text === 'string' ? text.match(/\{[\s\S]*\}/) : null
    if (!match) {
      log.error(`AI moderation returned unparseable output: ${String(text).slice(0, 200)}`)
      if (FAIL_CLOSED) return res.status(503).json({ error: 'Moderation unavailable' })
      return res.status(200).json({ data: unchecked('unparseable_response') })
    }

    try {
      const parsed = JSON.parse(match[0])
      return res.status(200).json({
        data: {
          flagged: Boolean(parsed.flagged),
          categories: Array.isArray(parsed.categories) ? parsed.categories : [],
          severity: parsed.severity || 'low',
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
          ai_checked: true,
        },
      })
    } catch {
      log.error('AI moderation returned invalid JSON')
      if (FAIL_CLOSED) return res.status(503).json({ error: 'Moderation unavailable' })
      return res.status(200).json({ data: unchecked('unparseable_response') })
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    log.error(`Moderation route error: ${error?.message || error}`)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
