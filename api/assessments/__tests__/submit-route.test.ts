/**
 * The assessment submission route.
 *
 * The grading arithmetic is covered in
 * `api/_lib/__tests__/assessment-grading.test.ts`. What is tested here is the
 * boundary: that the route refuses a caller-supplied verdict, that what lands
 * in `user_assessments` and `user_skills` is the score the server computed,
 * and that a UUID assessment id resolves — the id shape that made the old
 * ObjectId lookup silently skip promotion entirely.
 */

const mockRequireAuth = jest.fn()
const mockUserAssessmentsInsert = jest.fn()
const mockAssessmentsFindOne = jest.fn()
const mockUserSkillsFindOne = jest.fn()
const mockUserSkillsUpdate = jest.fn()
const mockSkillsFind = jest.fn()

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
  userSkills: async () => ({
    findOne: (...a: any[]) => mockUserSkillsFindOne(...a),
    findOneAndUpdate: (...a: any[]) => mockUserSkillsUpdate(...a),
  }),
  skills: async () => ({
    find: (...a: any[]) => ({ toArray: async () => mockSkillsFind(...a) }),
  }),
}))
jest.mock('../../../lib/data/assessment-questions', () => ({
  __esModule: true,
  assessmentQuestions: [
    { id: 'vocab-b-1', skill: 'vocabulary', correctAnswer: 'Hello' },
    { id: 'vocab-b-2', skill: 'vocabulary', correctAnswer: 'Thank you' },
    { id: 'vocab-b-3', skill: 'vocabulary', correctAnswer: 'Goodbye' },
    { id: 'vocab-b-4', skill: 'vocabulary', correctAnswer: 'Please' },
    { id: 'gram-b-1', skill: 'grammar', correctAnswer: 'Ndiri' },
    { id: 'gram-b-2', skill: 'grammar', correctAnswer: 'Uri' },
  ],
}))

/** `skills._id` is a UUID; the bank labels skills by name. */
const SKILL_DOCS = [
  { _id: 'skill-uuid-vocabulary', name: 'vocabulary' },
  { _id: 'skill-uuid-grammar', name: 'grammar' },
]

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

const ALL_CORRECT = {
  'vocab-b-1': 'Hello',
  'vocab-b-2': 'Thank you',
  'vocab-b-3': 'Goodbye',
  'vocab-b-4': 'Please',
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAuth.mockResolvedValue({ personId: 'person-1' })
  mockUserAssessmentsInsert.mockResolvedValue({ insertedId: 'ua-1' })
  mockAssessmentsFindOne.mockResolvedValue(null)
  mockUserSkillsFindOne.mockResolvedValue(null)
  mockUserSkillsUpdate.mockResolvedValue({})
  mockSkillsFind.mockResolvedValue(SKILL_DOCS)
})

describe('POST /api/assessments/submit', () => {
  it('rejects a body that carries its own score or passed', async () => {
    // The route used to record these verbatim. Rejecting rather than ignoring
    // surfaces a caller that still believes it decides the outcome.
    for (const forged of [{ score: 100 }, { passed: true }, { score: 100, passed: true }]) {
      const res = mockResponse()
      await handler(
        { method: 'POST', body: { skill_id: 'vocabulary', answers: ALL_CORRECT, ...forged } } as any,
        res
      )

      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(/computed server-side/)
    }
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
    expect(mockUserSkillsUpdate).not.toHaveBeenCalled()
  })

  it('persists the score it computed, not one the caller wanted', async () => {
    const res = mockResponse()
    await handler(
      {
        method: 'POST',
        body: {
          skill_id: 'vocabulary',
          // One of four right: 25%, whatever the caller may have hoped.
          answers: { 'vocab-b-1': 'Hello', 'vocab-b-2': 'wrong', 'vocab-b-3': 'wrong', 'vocab-b-4': 'wrong' },
        },
      } as any,
      res
    )

    expect(res.statusCode).toBe(201)
    expect(res.body.data).toMatchObject({ score: 25, correct: 1, total: 4, passed: false })

    const [inserted] = mockUserAssessmentsInsert.mock.calls[0]
    expect(inserted).toMatchObject({ user_id: 'person-1', score: 25, passed: false })
  })

  it('grades against the bank when no assessment document exists', async () => {
    const res = mockResponse()
    await handler({ method: 'POST', body: { skill_id: 'vocabulary', answers: ALL_CORRECT } } as any, res)

    expect(res.statusCode).toBe(201)
    expect(res.body.data).toMatchObject({ score: 100, passed: true })
    // A bank-graded pass records the score but never promotes a level.
    expect(res.body.data.level_achieved).toBeNull()
    const [filter, update] = mockUserSkillsUpdate.mock.calls[0]
    // Written against the skills._id, not the name the bank uses — a name here
    // would create a row the tutor prompt silently ignores.
    expect(filter).toEqual({ user_id: 'person-1', skill_id: 'skill-uuid-vocabulary' })
    expect(update.$set).toEqual({ current_score: 100 })
  })

  it('resolves a UUID assessment id and promotes to its target level', async () => {
    // The old lookup was ObjectId-only, so a UUID id found nothing and the
    // promotion branch never ran — a pass that silently did nothing.
    const uuid = '3f2504e0-4f89-11d3-9a0c-0305e82c3301'
    mockAssessmentsFindOne.mockResolvedValue({
      _id: uuid,
      target_level: 'intermediate',
      questions: [
        { id: 'q-a', correct_answer: 'Mhoro' },
        { id: 'q-b', correct_answer: 'Ndatenda' },
      ],
    })

    const res = mockResponse()
    await handler(
      {
        method: 'POST',
        body: { assessment_id: uuid, skill_id: 'vocabulary', answers: { 'q-a': 'Mhoro', 'q-b': 'Ndatenda' } },
      } as any,
      res
    )

    expect(res.statusCode).toBe(201)
    expect(res.body.data).toMatchObject({ score: 100, passed: true, level_achieved: 'intermediate' })

    // The filter must offer the raw string, not only an ObjectId.
    const [filter] = mockAssessmentsFindOne.mock.calls[0]
    expect(JSON.stringify(filter)).toContain(uuid)
  })

  it('prefers the assessment document key over the bank', async () => {
    // A seeded assessment owns its own answers; the bundled bank must not
    // override them just because the ids happen to collide.
    mockAssessmentsFindOne.mockResolvedValue({
      _id: 'a-1',
      questions: [{ id: 'vocab-b-1', correctAnswer: 'Something else entirely' }],
    })

    const res = mockResponse()
    await handler(
      { method: 'POST', body: { assessment_id: 'a-1', skill_id: 'vocabulary', answers: { 'vocab-b-1': 'Hello' } } } as any,
      res
    )

    expect(res.body.data).toMatchObject({ total: 1, correct: 0, score: 0 })
  })

  it('refuses to record a submission it cannot grade', async () => {
    // Storing a hollow zero would look like a failed attempt the learner made.
    const res = mockResponse()
    await handler(
      { method: 'POST', body: { skill_id: 'vocabulary', answers: { 'invented-id': 'Hello' } } } as any,
      res
    )

    expect(res.statusCode).toBe(422)
    expect(mockUserAssessmentsInsert).not.toHaveBeenCalled()
  })

  it('validates the submission shape', async () => {
    const cases: [any, RegExp][] = [
      [{ answers: ALL_CORRECT }, /skill_id/],
      [{ skill_id: 'vocabulary' }, /answers/],
      [{ skill_id: 'vocabulary', answers: {} }, /empty/],
      [{ skill_id: 'vocabulary', answers: { q1: { nested: true } } }, /must be a string/],
    ]

    for (const [body, expected] of cases) {
      const res = mockResponse()
      await handler({ method: 'POST', body } as any, res)
      expect(res.statusCode).toBe(400)
      expect(res.body.error).toMatch(expected)
    }
  })

  it('requires authentication and does not leak internals on failure', async () => {
    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
    const unauthorized = mockResponse()
    await handler({ method: 'POST', body: { skill_id: 'vocabulary', answers: ALL_CORRECT } } as any, unauthorized)
    expect(unauthorized.statusCode).toBe(401)

    mockRequireAuth.mockResolvedValue({ personId: 'person-1' })
    mockUserAssessmentsInsert.mockRejectedValue(new Error('connection string mongodb+srv://user:pw@host'))
    const failed = mockResponse()
    await handler({ method: 'POST', body: { skill_id: 'vocabulary', answers: ALL_CORRECT } } as any, failed)
    expect(failed.statusCode).toBe(500)
    expect(failed.body.error).toBe('Internal server error')
  })

  it('scores every skill a diagnostic covers, promoting none of them', async () => {
    const res = mockResponse()
    await handler(
      {
        method: 'POST',
        body: {
          skill_id: 'vocabulary',
          answers: {
            'vocab-b-1': 'Hello',
            'vocab-b-2': 'Thank you',
            'gram-b-1': 'Ndiri',
            'gram-b-2': 'wrong',
          },
        },
      } as any,
      res
    )

    expect(res.body.data.per_skill).toEqual({ vocabulary: 100, grammar: 50 })
    expect(res.body.data.skills_updated).toEqual(['skill-uuid-vocabulary', 'skill-uuid-grammar'])

    const scoresBySkill = Object.fromEntries(
      mockUserSkillsUpdate.mock.calls.map(([filter, update]: any[]) => [filter.skill_id, update.$set.current_score])
    )
    expect(scoresBySkill).toEqual({ 'skill-uuid-vocabulary': 100, 'skill-uuid-grammar': 50 })
    // No assessment document, so no level moves anywhere.
    expect(res.body.data.level_achieved).toBeNull()
  })

  it('records the attempt even when a skill cannot be resolved', async () => {
    // A skills collection that has not been seeded must not lose the learner's
    // work; only the user_skills row is skipped.
    mockSkillsFind.mockResolvedValue([])

    const res = mockResponse()
    await handler({ method: 'POST', body: { skill_id: 'vocabulary', answers: ALL_CORRECT } } as any, res)

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
