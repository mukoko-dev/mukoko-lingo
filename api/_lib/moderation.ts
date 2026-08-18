/**
 * Server-side content moderation for the AI chat proxy.
 *
 * Moderation used to run only in `lib/ai/moderation.ts`, which ships in the
 * client bundle and is called by the client before it posts to /api/ai/chat.
 * A control that runs entirely on the caller's side is one the caller can
 * skip: anyone with a session could POST straight to /api/ai/chat and reach
 * the model with no guardrails applied.
 *
 * This applies the same rule set on the server, where it can't be bypassed,
 * and records an alert so flagged content actually reaches the admin queue.
 */

import { randomUUID } from 'crypto'
import { evaluateGuardrails, type GuardrailVerdict } from '../../lib/ai/guardrail-rules'
import { moderationAlerts } from './mongo'
import { createLogger } from './logger'

const log = createLogger('moderation')

export type { GuardrailVerdict }

/**
 * Persist a flagged item for admin review.
 *
 * Field names match what the admin console renders (`content_type`,
 * `content_text`, `flagged_reason`) — nothing wrote to `moderation_alerts`
 * before this, so the review queue was permanently empty while the admin UI
 * and the analytics pending-count both read from it.
 */
export async function recordModerationAlert(params: {
  personId: string
  contentType: string
  contentText: string
  verdict: GuardrailVerdict
}): Promise<void> {
  try {
    const col = await moderationAlerts()
    await col.insertOne({
      _id: randomUUID(),
      status: 'pending',
      person_id: params.personId,
      content_type: params.contentType,
      // Truncated: the queue needs enough to judge the message, not an
      // unbounded copy of whatever was submitted.
      content_text: params.contentText.slice(0, 2000),
      flagged_reason: params.verdict.reason || params.verdict.categories.join(', '),
      categories: params.verdict.categories,
      severity: params.verdict.severity,
      confidence: params.verdict.confidence,
      created_at: new Date(),
    } as any)
  } catch (error: any) {
    // Never let alert-writing failure decide whether content is allowed —
    // the caller has already made that call.
    log.error(`Failed to record moderation alert: ${error?.message || error}`)
  }
}

/**
 * Apply the shared guardrails to a piece of user content. When it trips,
 * an alert is recorded and the verdict returned; otherwise null.
 */
export async function moderateUserContent(params: {
  personId: string
  content: string
  contentType?: string
}): Promise<GuardrailVerdict | null> {
  const verdict = evaluateGuardrails(params.content)
  if (!verdict?.flagged) return null

  log.warn(`Blocked ${params.contentType || 'chat_message'}: ${verdict.categories.join(', ')} (${verdict.severity})`)
  await recordModerationAlert({
    personId: params.personId,
    contentType: params.contentType || 'chat_message',
    contentText: params.content,
    verdict,
  })
  return verdict
}
