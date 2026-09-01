/**
 * Verdict extraction for /api/ai/moderate.
 *
 * The moderation pass fails open by default, so anything that makes the reply
 * unparseable silently removes the AI layer rather than surfacing an error.
 * Workers AI serves a reasoning-capable model, which is exactly the shape that
 * broke the old greedy `text.match(/\{[\s\S]*\}/)`.
 */

import { extractModerationJson } from '../moderate'

const VERDICT = '{"flagged": true, "categories": ["harassment"], "severity": "high", "confidence": 0.9}'

describe('extractModerationJson', () => {
  it('reads a bare JSON verdict', () => {
    expect(extractModerationJson(VERDICT)).toBe(VERDICT)
  })

  it('reads a verdict wrapped in prose', () => {
    expect(extractModerationJson(`Here is the result:\n${VERDICT}\nHope that helps.`)).toBe(VERDICT)
  })

  it('ignores a <think> block whose braces would corrupt the match', () => {
    const reply = `<think>The user wrote {something rude}. I should return {flagged: true}.</think>\n${VERDICT}`

    const extracted = extractModerationJson(reply)

    expect(extracted).toBe(VERDICT)
    // The point of the strip: the greedy match would otherwise start inside
    // the reasoning and produce a string JSON.parse rejects.
    expect(() => JSON.parse(extracted as string)).not.toThrow()
    expect(JSON.parse(extracted as string).flagged).toBe(true)
  })

  it('returns null when there is no object at all', () => {
    expect(extractModerationJson('I cannot help with that.')).toBeNull()
    expect(extractModerationJson('<think>still thinking about it</think>')).toBeNull()
  })

  it('returns null for a non-string reply rather than throwing', () => {
    // A provider shape change would otherwise take the route's 500 branch.
    expect(extractModerationJson(undefined)).toBeNull()
    expect(extractModerationJson({ text: VERDICT })).toBeNull()
  })
})
