/**
 * Assessment sessions.
 *
 * The property under test is that the *set of questions* is the server's, not
 * the caller's. Grading against "whatever ids the caller answered" let someone
 * submit one correct answer, score 1/1 and write `user_skills.current_score`
 * = 100 — the forged proficiency the server-side grading was meant to stop,
 * reached by choosing the denominator rather than the numerator.
 */

import {
  assertSessionUsable,
  buildSessionDoc,
  resolveQuestionCount,
  InvalidSessionError,
  SESSION_TTL_MS,
  MIN_QUESTIONS,
  MAX_QUESTIONS,
  DEFAULT_SKILL_QUESTIONS,
  DEFAULT_DIAGNOSTIC_QUESTIONS,
  type AssessmentSessionDoc,
} from '../assessment-session'

function session(overrides: Partial<AssessmentSessionDoc> = {}): AssessmentSessionDoc {
  return {
    _id: 'session-1',
    user_id: 'person-1',
    skill_id: 'vocabulary',
    resolved_skill_id: 'skill-uuid-vocabulary',
    assessment_id: null,
    question_ids: ['q1', 'q2', 'q3'],
    is_diagnostic: false,
    language: 'shona',
    created_at: new Date('2026-09-08T00:00:00Z'),
    expires_at: new Date('2026-09-08T02:00:00Z'),
    submitted_at: null,
    ...overrides,
  }
}

describe('resolveQuestionCount', () => {
  it('uses the default for each kind of assessment', () => {
    expect(resolveQuestionCount(undefined, false)).toBe(DEFAULT_SKILL_QUESTIONS)
    expect(resolveQuestionCount(undefined, true)).toBe(DEFAULT_DIAGNOSTIC_QUESTIONS)
  })

  it('clamps rather than refusing an absurd ask', () => {
    // A one-question quiz would make any single correct answer a perfect
    // score, which is the whole problem — so the floor matters more than the
    // ceiling, and neither is worth failing a learner over.
    expect(resolveQuestionCount(1, false)).toBe(MIN_QUESTIONS)
    expect(resolveQuestionCount(0, false)).toBe(MIN_QUESTIONS)
    expect(resolveQuestionCount(-40, false)).toBe(MIN_QUESTIONS)
    expect(resolveQuestionCount(5000, false)).toBe(MAX_QUESTIONS)
  })

  it('ignores anything that is not a finite number', () => {
    expect(resolveQuestionCount('20', false)).toBe(DEFAULT_SKILL_QUESTIONS)
    expect(resolveQuestionCount(NaN, false)).toBe(DEFAULT_SKILL_QUESTIONS)
    expect(resolveQuestionCount(Infinity, false)).toBe(DEFAULT_SKILL_QUESTIONS)
    expect(resolveQuestionCount({ valueOf: () => 9 }, false)).toBe(DEFAULT_SKILL_QUESTIONS)
  })
})

describe('buildSessionDoc', () => {
  const base = {
    userId: 'person-1',
    skillId: 'vocabulary',
    resolvedSkillId: 'skill-uuid-vocabulary',
    questionIds: ['q1', 'q2', 'q3'],
    isDiagnostic: false,
  }

  it('records the issued questions and a UUID id', () => {
    const doc = buildSessionDoc(base)

    expect(doc.question_ids).toEqual(['q1', 'q2', 'q3'])
    expect(doc.submitted_at).toBeNull()
    // Every populated `lingo` collection keys on UUID strings, not ObjectIds.
    expect(doc._id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/)
  })

  it('expires', () => {
    const now = new Date('2026-09-08T00:00:00Z')
    const doc = buildSessionDoc({ ...base, now })

    expect(doc.expires_at.getTime() - now.getTime()).toBe(SESSION_TTL_MS)
  })

  it('refuses to issue an empty quiz', () => {
    // A session with no questions would grade every submission against an
    // empty key — 0 of 0, recorded as a real attempt.
    expect(() => buildSessionDoc({ ...base, questionIds: [] })).toThrow(InvalidSessionError)
  })
})

describe('assertSessionUsable', () => {
  it('accepts the owner while it is open and unexpired', () => {
    expect(assertSessionUsable(session(), 'person-1', new Date('2026-09-08T01:00:00Z'))._id).toBe('session-1')
  })

  it("treats someone else's session as absent", () => {
    // A 404 rather than a 403: a wrong id and another learner's id should be
    // indistinguishable, or the response enumerates sessions.
    const error = catchError(() => assertSessionUsable(session(), 'person-2'))

    expect(error).toBeInstanceOf(InvalidSessionError)
    expect((error as InvalidSessionError).status).toBe(404)
    expect(error?.message).toMatch(/not found/)
  })

  it('is single use', () => {
    // Re-grading a quiz is retrying it until the answers come out right.
    const error = catchError(() =>
      assertSessionUsable(session({ submitted_at: new Date() }), 'person-1', new Date('2026-09-08T01:00:00Z'))
    )

    expect((error as InvalidSessionError).status).toBe(409)
  })

  it('expires', () => {
    const error = catchError(() => assertSessionUsable(session(), 'person-1', new Date('2026-09-08T03:00:00Z')))

    expect((error as InvalidSessionError).status).toBe(410)
  })

  it('rejects a session that does not exist', () => {
    expect(() => assertSessionUsable(null, 'person-1')).toThrow(InvalidSessionError)
  })
})

function catchError(fn: () => unknown): Error | null {
  try {
    fn()
    return null
  } catch (error) {
    return error as Error
  }
}
