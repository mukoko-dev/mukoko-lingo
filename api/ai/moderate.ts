/**
 * Server-side AI Content Moderation
 *
 * Uses Anthropic Claude to check content for policy violations.
 * API key stays server-side.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAuth } from '../_lib/auth-middleware'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || process.env.AI_GATEWAY_API_KEY || ''
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAuth(req)

    const { content } = req.body || {}
    if (!content) return res.status(400).json({ error: 'content is required' })

    if (!ANTHROPIC_API_KEY) {
      // No API key — skip AI moderation, rely on local guardrails only
      return res.status(200).json({ data: { flagged: false, categories: [], severity: 'low', confidence: 0 } })
    }

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
          { role: 'user', content: `Check this message: ${JSON.stringify(content)}` },
        ],
      }),
    })

    if (!response.ok) {
      console.error(`[mukoko][moderation] Anthropic API error: ${response.status}`)
      return res.status(200).json({ data: { flagged: false, categories: [], severity: 'low', confidence: 0 } })
    }

    const data = await response.json()
    const text = data.content?.[0]?.text || '{}'

    try {
      const result = JSON.parse(text)
      return res.status(200).json({ data: result })
    } catch {
      return res.status(200).json({ data: { flagged: false, categories: [], severity: 'low', confidence: 0 } })
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
