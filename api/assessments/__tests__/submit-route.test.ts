/**
 * The assessment submission route.
 *
 * The grading arithmetic is covered in
 * `api/_lib/__tests__/assessment-grading.test.ts` and the session rules in
 * `assessment-session.test.ts`. What is tested here is the boundary: that the
 * route refuses a caller-supplied verdict, that it grades against the
 * questions the **server** issued rather than the ones the caller answered,
 * and that what lands in `user_skills` is keyed by `skills._id`.
 *
 * The case that named this file is `cannot shrink the denominator`: on the
 * previous contract, submitting a single correct answer scored 100%.
 */

const mockRequireAuth = jest.fn()
const mockUserAssessmentsInsert = jest.fn()
const mockAssessmentsFindOne = jest.fn()
const mockUserSkillsFindOne = jest.fn()
const mockUserSkillsUpdate = jest.fn()
const mockSkillsFind = jest.fn()
const mockSessionFindOne = jest.fn()
const mockSessionUpdate = jest.fn()

// Each factory delegates rather than capturing the jest.fn directly: Babel
// hoists the `import` below above these `const` declarations, so a factory
// that closed over them would read them in their temporal dead zone.
jest.mock('../../_lib/cors', () => ({ __esModule: true, handleCors: () => false }))
jest.mock('../../_lib/auth-middleware', () => ({
  __esModule: true,
  requireAuth: (...a: any[]) => mockRequireAuth(...a),
}))
jest.mock('../../_lib/logger', () => ({
  __esModule: true,
  createLogger: () => ({ error: () => {}, info: () => {}, warn: () => {} }),
}))
jest.mock('../../_lib/mongo', () => ({
  __esModule: true,
  userAssessments: async () => ({ insertOne: (...a: any[]) => mockUserAssessmentsInsert(...a) }),
  assessments: async () => ({ findOne: (...a: any[]) => mockAssessmentsFindOne(...a) }),
  assessmentSessions: async () => ({
    findOne: (...a: any[]) => mockSessionFindOne(...a),
    findOneAndUpdate: (...a: any[]) => mockSessionUpdate(...a),
  }),
  userSkills: async () => ({
    findOne: (...a: any[]) => mockUserSkillsFindOne(...a),
    findOneAndUpdate: (...a: any[]) => mockUserSkillsUpdate(...a),
  }),
  skills: async () => ({
    find: (...a: any[]) => ({ toArray: async () => mockSkillsFind(...a) }),
  }),
}))
jest.mock('../../_lib/question-bank', () => ({
  __esModule: true,
  // Levels matter: they cap what a perfect run may write to user_skills.
  assessmentQuestions: [
    { id: 'vocab-b-1', skill: 'vocabulary', correctAnswer: 'Hello', level: 'beginner' },
    { id: 'vocab-b-2', skill: 'vocabulary', correctAnswer: 'Thank you', level: 'beginner' },
    { id: 'vocab-b-3', skill: 'vocabulary', correctAnswer: 'Goodbye', level: 'beginner' },
    { id: 'vocab-b-4', skill: 'vocabulary', correctAnswer: 'Please', level: 'beginner' },
    { id: 'gram-b-1', skill: 'grammar', correctAnswer: 'Ndiri', level: 'beginner' },
    { id: 'gram-b-2', skill: 'grammar', correctAnswer: 'Uri', level: 'beginner' },
    { id: 'vocab-a-1', skill: 'vocabulary', correctAnswer: 'Chokwadi', level: 'advanced' },
  ],
}))

/** `skills._id` is a UUID; the bank labels skills by name. */
const SKILL_DOCS = [
  { _id: 'skill-uuid-vocabulary', name: 'vocabulary' },
  { _id: 'skill-uuid-grammar', name: 'grammar' },
]

const VOCAB_IDS = ['vocab-b-1', 'vocab-b-2', 'vocab-b-3', 'vocab-b-4']

import handler from '../submit'

function mockResponse() {
  const res: any = {}
  res.statusCode = 0
  res.body = undefined
  res.status = (code: number) => {
    res.statusCode = code
    return res
  }
  res.json = (payload: any) => {
    res.body = payload
    return res
  }
  res.setHeader = () => res
  return res
}

function issuedSession(overrides: Record<string, unknown> = {}) {
  return {
    _id: 'session-1',
    user_id: 'person-1',
    skill_id: 'vocabulary',
    resolved_skill_id: 'skill-uuid-vocabulary',
    assessment_id: null,
    question_ids: [...VOCAB_IDS],
    is_diagnostic: false,
    language: 'shona',
    created_at: new Date(),
    expires_at: new Date(Date.now() + 60 * 60 * 1000),
    submitted_at: null,
    ...overrides,
  }
}

const ALL_CORRECT = {
  'vocab-b-1': 'Hello',
  'vocab-b-2': 'Thank you',
  'vocab-b-3': 'Goodbye',
  'vocab-b-4': 'Please',
}

async function submit(body: Record<string, unknown>) {
  const res = mockResponse()
  await handler({ method: 'POST', body } as any, res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAuth.mockResolvedValue({ personId: 'person-1' })
  mockUserAssessmentsInsert.mockResolvedValue({ insertedId: 'ua-1' })
  mockAssessmentsFindOne.mockResolvedValue(null)
  mockUserSkillsFindOne.mockResolvedValue(null)
  mockUserSkillsUpdate.mockResolvedValue({})
  mockSkillsFind.mockResolvedValue(SKILL_DOCS)
  mockSessionFindOne.mockResolvedValue(issuedSession())
  mockSessionUpdate.mockResolvedValue({ value: issuedSession() })
})

describe('POST /api/assessments/submit', () => {
  it('cannot shrink the denominator by answering fewer questions', async () => {
    // The bug this route was rewritten for. The key is the four questions the
    // server issued, so one correct answer is 25% — not the 100% it scored
    // when the key was built from `Object.keys(answers)`.
    const res = await submit({ session_id: 'session-1', answers: { 'vocab-b-1': 'Hello' } })

    expect(res.statusCode).toBe(201)
    expect(res.body.data).toMatchObject({ score: 25, correct: 1, total: 4, passed: false })

    const [, update] = mockUserSkillsUpdate.mock.calls[0]
    expect(update.$set).toEqual({ current_score: 25 })  // under the cap, untouched
  })

  it('ignores answers to questions it did not issue', async () => {
    // Padding with ids from elsewhere in the bank must not add to the total in
    // either direction.
    const res = await submit({
      session_id: 'session-1',
      answers: { ...ALL_CORRECT, 'gram-b-1': 'Ndiri', 'invented-id': 'Hello' },
    })

    expect(res.body.data).toMatchObject({ total: 4, correct: 4, score: 100 })
    expect(res.body.data.per_skill).toEqual({ vocabulary: 100 })
  })

  it('counts an unanswered issued question as wrong', async () => {
    const res = await submit({
      session_id: 'session-1',
      answers: { 'vocab-b-1': 'Hello', 'vocab-b-2': 'Thank you' },
    })

    expect(res.body.data).toMatchObject({ total: 4, correct: 2, score: 50 })
    expect(res.body.data.results.find((r: any) => r.questionId === 'vocab-b-4').userAnswer).toBe('')
  })

  it('rejects a body that carries its own score or passed', async () => {
    for (const forged of [{ score: 100 }, { passed: true }, { score: 100, passed: true }]) {
      const res = await submit({ session_id: 'session-1', answers: ALL_CORRECT, ...forged })

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/computed server-side/)
    }
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
    expect(mockUserSkillsUpdate).not.toHaveBeenCalled()
  })

  it('requires a session, naming the route that issues one', async () => {
    const res = await submit({ skill_id: 'vocabulary', answers: ALL_CORRECT })

    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/assessments\/start/)
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
  })

  it("will not grade against someone else's session", async () => {
    mockSessionFindOne.mockResolvedValue(issuedSession({ user_id: 'person-2' }))

    const res = await submit({ session_id: 'session-1', answers: ALL_CORRECT })

    expect(res.statusCode).toBe(404)
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
  })

  it('refuses a session that was already submitted, and one that expired', async () => {
    mockSessionFindOne.mockResolvedValue(issuedSession({ submitted_at: new Date() }))
    expect((await submit({ session_id: 'session-1', answers: ALL_CORRECT })).statusCode).toBe(409)

    mockSessionFindOne.mockResolvedValue(issuedSession({ expires_at: new Date(Date.now() - 1000) }))
    expect((await submit({ session_id: 'session-1', answers: ALL_CORRECT })).statusCode).toBe(410)

    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
  })

  it('loses the race rather than grading the same quiz twice', async () => {
    // Two submissions in flight: the claim is what decides, not the read.
    mockSessionUpdate.mockResolvedValue({ value: null })

    const res = await submit({ session_id: 'session-1', answers: ALL_CORRECT })

    expect(res.statusCode).toBe(409)
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
    const [filter] = mockSessionUpdate.mock.calls[0]
    expect(filter).toEqual({ _id: 'session-1', submitted_at: null })
  })

  it('writes user_skills against the skills._id, not the bank name', async () => {
    const res = await submit({ session_id: 'session-1', answers: ALL_CORRECT })

    expect(res.statusCode).toBe(201)
    expect(res.body.data.level_achieved).toBeNull()
    const [filter, update] = mockUserSkillsUpdate.mock.calls[0]
    // A name here would create a row the tutor prompt silently ignores.
    expect(filter).toEqual({ user_id: 'person-1', skill_id: 'skill-uuid-vocabulary' })
    // 100% of beginner questions, capped: the reported score is still 100, but
    // what is persisted as proficiency is what the questions could show.
    expect(res.body.data.score).toBe(100)
    expect(update.$set).toEqual({ current_score: 64 })
  })

  it('caps the persisted score by the difficulty of the questions asked', async () => {
    // Found by driving the real handlers against the real bank: a diagnostic
    // is drawn entirely from beginner questions, and a perfect run was writing
    // current_score = 100 — "fluent" — which tutor-prompt.ts reads every turn.
    // Retakes are unlimited and keep the best score, so guessing until it
    // landed cost nothing.
    const beginnerOnly = await submit({ session_id: 'session-1', answers: ALL_CORRECT })
    expect(beginnerOnly.body.data.score_ceiling).toBe(64)
    expect(mockUserSkillsUpdate.mock.calls[0][1].$set).toEqual({ current_score: 64 })

    jest.clearAllMocks()
    mockRequireAuth.mockResolvedValue({ personId: 'person-1' })
    mockUserAssessmentsInsert.mockResolvedValue({ insertedId: 'ua-2' })
    mockAssessmentsFindOne.mockResolvedValue(null)
    mockUserSkillsFindOne.mockResolvedValue(null)
    mockSkillsFind.mockResolvedValue(SKILL_DOCS)
    mockSessionFindOne.mockResolvedValue(issuedSession({ question_ids: ['vocab-a-1'] }))
    mockSessionUpdate.mockResolvedValue({ value: issuedSession() })

    // An advanced question can evidence anything.
    const advanced = await submit({ session_id: 'session-1', answers: { 'vocab-a-1': 'Chokwadi' } })
    expect(advanced.body.data.score_ceiling).toBe(100)
    expect(mockUserSkillsUpdate.mock.calls[0][1].$set).toEqual({ current_score: 100 })
  })

  it('scores every skill a diagnostic covers, promoting none of them', async () => {
    mockSessionFindOne.mockResolvedValue(
      issuedSession({
        skill_id: 'diagnostic',
        resolved_skill_id: null,
        is_diagnostic: true,
        question_ids: ['vocab-b-1', 'vocab-b-2', 'gram-b-1', 'gram-b-2'],
      })
    )

    const res = await submit({
      session_id: 'session-1',
      answers: { 'vocab-b-1': 'Hello', 'vocab-b-2': 'Thank you', 'gram-b-1': 'Ndiri', 'gram-b-2': 'wrong' },
    })

    expect(res.body.data.per_skill).toEqual({ vocabulary: 100, grammar: 50 })
    expect(res.body.data.skills_updated).toEqual(['skill-uuid-vocabulary', 'skill-uuid-grammar'])
    const scoresBySkill = Object.fromEntries(
      mockUserSkillsUpdate.mock.calls.map(([filter, update]: any[]) => [filter.skill_id, update.$set.current_score])
    )
    // Reported per-skill is 100/50; persisted is capped to what beginner
    // questions can demonstrate. 50 is already under the cap and passes through.
    expect(res.body.data.per_skill).toEqual({ vocabulary: 100, grammar: 50 })
    expect(scoresBySkill).toEqual({ 'skill-uuid-vocabulary': 64, 'skill-uuid-grammar': 50 })
    expect(res.body.data.level_achieved).toBeNull()
  })

  it('prefers the assessment document key, restricted to the issued questions', async () => {
    // A seeded assessment owns its answers; it still cannot widen the quiz
    // beyond what this session issued.
    mockSessionFindOne.mockResolvedValue(
      issuedSession({ assessment_id: 'a-1', question_ids: ['vocab-b-1'] })
    )
    mockAssessmentsFindOne.mockResolvedValue({
      _id: 'a-1',
      target_level: 'intermediate',
      questions: [
        { id: 'vocab-b-1', correctAnswer: 'Something else entirely' },
        { id: 'vocab-b-2', correctAnswer: 'Thank you' },
      ],
    })

    const res = await submit({ session_id: 'session-1', answers: { 'vocab-b-1': 'Hello' } })

    expect(res.body.data).toMatchObject({ total: 1, correct: 0, score: 0 })
  })

  it('promotes to the assessment target level on a pass', async () => {
    mockSessionFindOne.mockResolvedValue(issuedSession({ assessment_id: 'a-1', question_ids: ['q-a', 'q-b'] }))
    mockAssessmentsFindOne.mockResolvedValue({
      _id: 'a-1',
      target_level: 'intermediate',
      questions: [
        { id: 'q-a', correct_answer: 'Mhoro' },
        { id: 'q-b', correct_answer: 'Ndatenda' },
      ],
    })

    const res = await submit({
      session_id: 'session-1',
      answers: { 'q-a': 'Mhoro', 'q-b': 'Ndatenda' },
    })

    expect(res.body.data).toMatchObject({ score: 100, passed: true, level_achieved: 'intermediate' })
  })

  it('releases the correct answers only with the result', async () => {
    const res = await submit({ session_id: 'session-1', answers: { 'vocab-b-1': 'wrong' } })

    // The client never held the key; this is where a review comes from.
    const graded = res.body.data.results.find((r: any) => r.questionId === 'vocab-b-1')
    expect(graded).toMatchObject({ correctAnswer: 'Hello', userAnswer: 'wrong', correct: false })
  })

  it('refuses to record a submission it cannot grade', async () => {
    // A bank edited between issue and submit. A hollow zero would look like a
    // failed attempt the learner made.
    mockSessionFindOne.mockResolvedValue(issuedSession({ question_ids: ['retired-question'] }))

    const res = await submit({ session_id: 'session-1', answers: { 'retired-question': 'Hello' } })

    expect(res.statusCode).toBe(422)
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
  })

  it('validates the submission shape', async () => {
    const cases: [any, RegExp][] = [
      [{ session_id: 'session-1' }, /answers/],
      [{ session_id: 'session-1', answers: {} }, /empty/],
      [{ session_id: 'session-1', answers: { q1: { nested: true } } }, /must be a string/],
    ]

    for (const [body, expected] of cases) {
      const res = await submit(body)
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(expected)
    }
  })

  it('requires authentication and does not leak internals on failure', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
    expect((await submit({ session_id: 'session-1', answers: ALL_CORRECT })).statusCode).toBe(401)

    mockRequireAuth.mockResolvedValue({ personId: 'person-1' })
    mockUserAssessmentsInsert.mockRejectedValue(new Error('connection string mongodb+srv://user:pw@host'))
    const failed = await submit({ session_id: 'session-1', answers: ALL_CORRECT })
    expect(failed.statusCode).toBe(500)
    expect(failed.body.error).toBe('Internal server error')
  })

  it('records the attempt even when a skill cannot be resolved', async () => {
    // A skills collection that has not been seeded must not lose the learner's
    // work; only the user_skills row is skipped.
    mockSkillsFind.mockResolvedValue([])
    mockSessionFindOne.mockResolvedValue(issuedSession({ resolved_skill_id: null }))

    const res = await submit({ session_id: 'session-1', answers: ALL_CORRECT })

    expect(res.statusCode).toBe(201)
    expect(mockUserAssessmentsInsert).toHaveBeenCalled()
    expect(mockUserSkillsUpdate).not.toHaveBeenCalled()
    expect(res.body.data.skills_updated).toEqual([])
  })

  it('rejects a non-POST method', async () => {
    const res = mockResponse()
    await handler({ method: 'GET', body: {} } as any, res)
    expect(res.statusCode).toBe(405)
  })
})
