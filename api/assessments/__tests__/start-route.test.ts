/**
 * The assessment issuing route.
 *
 * Two properties matter here, and they are the two that make the submit route
 * trustworthy: the questions a learner receives carry **no answers**, and the
 * ids the server stored are what grading will use — the caller has no say in
 * either.
 */

const mockRequireAuth = jest.fn()
const mockSessionInsert = jest.fn()
const mockAssessmentsFindOne = jest.fn()
const mockSkillsFind = jest.fn()

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
  assessmentSessions: async () => ({ insertOne: (...a: any[]) => mockSessionInsert(...a) }),
  assessments: async () => ({ findOne: (...a: any[]) => mockAssessmentsFindOne(...a) }),
  skills: async () => ({
    find: (...a: any[]) => ({ toArray: async () => mockSkillsFind(...a) }),
  }),
}))

const SKILL_DOCS = [{ _id: 'skill-uuid-vocabulary', name: 'vocabulary' }]

import handler from '../start'

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

async function start(body: Record<string, unknown>) {
  const res = mockResponse()
  await handler({ method: 'POST', body } as any, res)
  return res
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRequireAuth.mockResolvedValue({ personId: 'person-1' })
  mockSessionInsert.mockResolvedValue({ insertedId: 'session-1' })
  mockAssessmentsFindOne.mockResolvedValue(null)
  mockSkillsFind.mockResolvedValue(SKILL_DOCS)
})

describe('POST /api/assessments/start', () => {
  it('issues questions with no answers and no explanations', async () => {
    const res = await start({ skill_id: 'vocabulary' })

    expect(res.statusCode).toBe(201)
    expect(res.body.data.questions.length).toBeGreaterThan(0)
    for (const q of res.body.data.questions) {
      expect(q).not.toHaveProperty('correctAnswer')
      expect(q).not.toHaveProperty('explanation')
      expect(q.options.length).toBeGreaterThan(0)
    }
    // The whole payload, not just the fields we thought to check.
    expect(JSON.stringify(res.body)).not.toContain('correctAnswer')
  })

  it('stores exactly the ids it issued', async () => {
    // Submit grades against this list, so a drift between what was sent and
    // what was stored is a learner graded on questions they never saw.
    const res = await start({ skill_id: 'vocabulary' })

    const [stored] = mockSessionInsert.mock.calls[0]
    expect(stored.question_ids).toEqual(res.body.data.questions.map((q: any) => q.id))
    expect(stored.user_id).toBe('person-1')
    expect(stored.submitted_at).toBeNull()
    expect(res.body.data.session_id).toBe(stored._id)
  })

  it('resolves the skill name to a skills._id up front', async () => {
    const [stored] = (await start({ skill_id: 'vocabulary' }), mockSessionInsert.mock.calls[0])

    expect(stored.resolved_skill_id).toBe('skill-uuid-vocabulary')
  })

  it('clamps how many questions a caller may ask for', async () => {
    const res = await start({ skill_id: 'vocabulary', count: 500 })

    expect(res.body.data.questions.length).toBeLessThanOrEqual(25)
    // And the floor: a one-question quiz would make one right answer 100%.
    const small = await start({ skill_id: 'vocabulary', count: 1 })
    expect(small.body.data.questions.length).toBeGreaterThanOrEqual(3)
  })

  it('issues a diagnostic across several skills', async () => {
    const res = await start({ skill_id: 'diagnostic' })

    const [stored] = mockSessionInsert.mock.calls[0]
    expect(stored.is_diagnostic).toBe(true)
    expect(new Set(res.body.data.questions.map((q: any) => q.skill)).size).toBeGreaterThan(1)
  })

  it('ignores an unrecognised language rather than filtering on it', async () => {
    // The value reaches a bank filter; an allowlist keeps it from emptying the
    // quiz (or from being interesting to send).
    const res = await start({ skill_id: 'vocabulary', language: "'; drop --" })

    expect(res.statusCode).toBe(201)
    expect(res.body.data.questions.length).toBeGreaterThan(0)
    expect(mockSessionInsert.mock.calls[0][0].language).toBeNull()
  })

  it('refuses a skill it has no questions for', async () => {
    mockSkillsFind.mockResolvedValue([])

    const res = await start({ skill_id: 'underwater-basket-weaving' })

    expect(res.statusCode).toBe(422)
    expect(mockSessionInsert).not.toHaveBeenCalled()
  })

  it('takes its question list from an assessment document when one exists', async () => {
    mockAssessmentsFindOne.mockResolvedValue({
      _id: 'a-1',
      questions: [{ id: 'q-a', correctAnswer: 'Mhoro' }, { question_id: 'q-b', correct_answer: 'Ndatenda' }],
    })

    const res = await start({ skill_id: 'vocabulary', assessment_id: 'a-1' })

    const [stored] = mockSessionInsert.mock.calls[0]
    expect(stored.question_ids).toEqual(['q-a', 'q-b'])
    expect(stored.assessment_id).toBe('a-1')
    // Those ids are not in the bank, so nothing can be rendered for them here;
    // what matters is that grading will use them.
    expect(res.statusCode).toBe(201)
  })

  it('requires skill_id, authentication, and POST', async () => {
    expect((await start({})).statusCode).toBe(400)

    mockRequireAuth.mockRejectedValue(new Error('Unauthorized'))
    expect((await start({ skill_id: 'vocabulary' })).statusCode).toBe(401)

    const res = mockResponse()
    await handler({ method: 'GET', body: {} } as any, res)
    expect(res.statusCode).toBe(405)
  })

  it('does not leak internals when the database fails', async () => {
    mockSessionInsert.mockRejectedValue(new Error('connection string mongodb+srv://user:pw@host'))

    const res = await start({ skill_id: 'vocabulary' })

    expect(res.statusCode).toBe(500)
    expect(res.body.error).toBe('Internal server error')
  })
})
