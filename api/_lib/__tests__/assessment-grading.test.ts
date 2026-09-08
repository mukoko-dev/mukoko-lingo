/**
 * Assessment grading.
 *
 * The property under test is that a learner cannot decide their own score.
 * `user_skills.current_score` feeds the tutor prompt on every AI turn and
 * gates level progression, so the interesting cases here are the ones someone
 * would try on purpose: a padded answer map, an invented question id, a
 * partial submission, a retake that went worse.
 */

import {
  sanitizeAnswers,
  answerKeyFromAssessment,
  answerKeyFromBank,
  gradeAnswers,
  resolvePassingScore,
  resolveSkillUpdate,
  InvalidSubmissionError,
  DEFAULT_PASSING_SCORE,
  MAX_ANSWERS,
  MAX_ANSWER_CHARS,
} from '../assessment-grading'

const KEY = [
  { questionId: 'q1', correctAnswer: 'Hello', skill: 'vocabulary' },
  { questionId: 'q2', correctAnswer: 'Thank you', skill: 'vocabulary' },
  { questionId: 'q3', correctAnswer: 'Goodbye', skill: 'grammar' },
  { questionId: 'q4', correctAnswer: 'Please', skill: 'grammar' },
]

describe('sanitizeAnswers', () => {
  it('accepts a flat map of strings', () => {
    expect(sanitizeAnswers({ q1: 'Hello', q2: '' })).toEqual({ q1: 'Hello', q2: '' })
  })

  it('rejects anything that is not an object of strings', () => {
    // Without this, a nested object would never match a key entry but would
    // still be written verbatim into user_assessments.
    expect(() => sanitizeAnswers({ q1: { cheat: true } })).toThrow(InvalidSubmissionError)
    expect(() => sanitizeAnswers({ q1: 100 })).toThrow(InvalidSubmissionError)
    expect(() => sanitizeAnswers(['Hello'])).toThrow(InvalidSubmissionError)
    expect(() => sanitizeAnswers('Hello')).toThrow(InvalidSubmissionError)
    expect(() => sanitizeAnswers(null)).toThrow(InvalidSubmissionError)
  })

  it('rejects an empty submission rather than grading it as zero', () => {
    expect(() => sanitizeAnswers({})).toThrow(/cannot be empty/)
  })

  it('caps the number and size of answers', () => {
    const tooMany = Object.fromEntries(
      Array.from({ length: MAX_ANSWERS + 1 }, (_, i) => [`q${i}`, 'a'])
    )
    expect(() => sanitizeAnswers(tooMany)).toThrow(/cannot exceed/)
    expect(() => sanitizeAnswers({ q1: 'x'.repeat(MAX_ANSWER_CHARS + 1) })).toThrow(/exceeds/)
  })
})

describe('gradeAnswers', () => {
  it('scores from the answers, not from anything the caller claims', () => {
    const result = gradeAnswers(KEY, { q1: 'Hello', q2: 'Thank you', q3: 'wrong', q4: 'wrong' })

    expect(result.score).toBe(2)
    expect(result.total).toBe(4)
    expect(result.percentage).toBe(50)
    expect(result.passed).toBe(false)
  })

  it('counts an unanswered question as wrong, using the key for the total', () => {
    // The attack this closes: submit one correct answer and call it 100%.
    const result = gradeAnswers(KEY, { q1: 'Hello' })

    expect(result.total).toBe(4)
    expect(result.score).toBe(1)
    expect(result.percentage).toBe(25)
    expect(result.perQuestion.find((q) => q.questionId === 'q2')?.userAnswer).toBe('')
  })

  it('ignores answers to questions the key does not contain', () => {
    // Padding the map with invented ids must not move the score in either
    // direction.
    const result = gradeAnswers(KEY, {
      q1: 'Hello',
      q2: 'Thank you',
      q3: 'Goodbye',
      q4: 'Please',
      'made-up-1': 'Hello',
      'made-up-2': 'Hello',
    })

    expect(result.total).toBe(4)
    expect(result.percentage).toBe(100)
    expect(result.perQuestion).toHaveLength(4)
  })

  it('compares trimmed and case-insensitively', () => {
    // More forgiving than the old client-side `===`, which failed a learner
    // for a capital letter on a free-text answer.
    const result = gradeAnswers(KEY, { q1: '  hello ', q2: 'THANK YOU', q3: 'Goodbye', q4: 'Please' })

    expect(result.percentage).toBe(100)
  })

  it('honours the pass mark it is given', () => {
    const answers = { q1: 'Hello', q2: 'Thank you', q3: 'Goodbye', q4: 'wrong' } // 75%

    expect(gradeAnswers(KEY, answers, DEFAULT_PASSING_SCORE).passed).toBe(true)
    expect(gradeAnswers(KEY, answers, 80).passed).toBe(false)
  })

  it('breaks a diagnostic down per skill', () => {
    const result = gradeAnswers(KEY, { q1: 'Hello', q2: 'Thank you', q3: 'wrong', q4: 'wrong' })

    expect(result.perSkill).toEqual({ vocabulary: 100, grammar: 0 })
  })

  it('never passes an empty key', () => {
    const result = gradeAnswers([], { q1: 'Hello' })

    expect(result).toMatchObject({ score: 0, total: 0, percentage: 0, passed: false })
  })
})

describe('answerKeyFromAssessment', () => {
  it('reads both the bank camelCase and the database snake_case spellings', () => {
    // lingo.assessments is empty and has no seeder yet, so neither spelling is
    // established; betting on one would fail silently at seed time.
    const key = answerKeyFromAssessment({
      questions: [
        { id: 'q1', correctAnswer: 'Hello', skill: 'vocabulary' },
        { question_id: 'q2', correct_answer: 'Thank you' },
      ],
    })

    expect(key).toEqual([
      { questionId: 'q1', correctAnswer: 'Hello', skill: 'vocabulary' },
      { questionId: 'q2', correctAnswer: 'Thank you', skill: undefined },
    ])
  })

  it('skips entries that cannot be graded rather than counting them wrong', () => {
    const key = answerKeyFromAssessment({
      questions: [
        { id: 'q1', correctAnswer: 'Hello' },
        { id: 'q2' }, // no answer — ungradeable
        { correctAnswer: 'orphan' }, // no id
        'not an object',
        null,
      ],
    })

    expect(key).toHaveLength(1)
    expect(key[0].questionId).toBe('q1')
  })

  it('returns nothing for an assessment with no questions', () => {
    expect(answerKeyFromAssessment(null)).toEqual([])
    expect(answerKeyFromAssessment({})).toEqual([])
    expect(answerKeyFromAssessment({ questions: 'nope' as any })).toEqual([])
  })
})

describe('answerKeyFromBank', () => {
  const bank = [
    { id: 'vocab-b-1', correctAnswer: 'Hello', skill: 'vocabulary' },
    { id: 'vocab-b-2', correctAnswer: 'Hello', skill: 'vocabulary' },
    { id: 'gram-b-1', correctAnswer: 'Ndiri', skill: 'grammar' },
  ]

  it('keys only the questions the submission actually names', () => {
    const key = answerKeyFromBank(bank, ['vocab-b-1', 'gram-b-1'])

    expect(key.map((k) => k.questionId)).toEqual(['vocab-b-1', 'gram-b-1'])
  })

  it('drops ids the bank does not know', () => {
    expect(answerKeyFromBank(bank, ['invented'])).toEqual([])
  })
})

describe('resolvePassingScore', () => {
  it('uses the assessment threshold when it is sane', () => {
    expect(resolvePassingScore({ passing_score: 80 })).toBe(80)
    expect(resolvePassingScore({ passing_score: 0 })).toBe(0)
  })

  it('falls back to the default for a missing or impossible threshold', () => {
    expect(resolvePassingScore(null)).toBe(DEFAULT_PASSING_SCORE)
    expect(resolvePassingScore({})).toBe(DEFAULT_PASSING_SCORE)
    expect(resolvePassingScore({ passing_score: -5 })).toBe(DEFAULT_PASSING_SCORE)
    expect(resolvePassingScore({ passing_score: 150 })).toBe(DEFAULT_PASSING_SCORE)
    expect(resolvePassingScore({ passing_score: 'high' })).toBe(DEFAULT_PASSING_SCORE)
  })
})

describe('resolveSkillUpdate', () => {
  it('promotes only when a real assessment names a target level', () => {
    const promoted = resolveSkillUpdate({
      existing: { current_score: 40, current_level: 'beginner' },
      percentage: 90,
      passed: true,
      assessment: { target_level: 'intermediate' },
    })

    expect(promoted).toMatchObject({ current_score: 90, current_level: 'intermediate' })
    expect(promoted?.level_achieved_at).toBeInstanceOf(Date)
  })

  it('records the score but never a level for a bank-graded quiz', () => {
    // The bank has no notion of a target level, so a pass on a
    // client-assembled quiz must not invent a promotion — that is the hole.
    const update = resolveSkillUpdate({
      existing: { current_score: 40, current_level: 'beginner' },
      percentage: 90,
      passed: true,
      assessment: null,
    })

    expect(update).toEqual({ current_score: 90 })
    expect(update).not.toHaveProperty('current_level')
  })

  it('does not promote on a failing score even with a target level', () => {
    const update = resolveSkillUpdate({
      existing: { current_score: 40, current_level: 'beginner' },
      percentage: 50,
      passed: false,
      assessment: { target_level: 'intermediate' },
    })

    expect(update).toEqual({ current_score: 50 })
  })

  it('keeps the best score when a retake goes worse', () => {
    const update = resolveSkillUpdate({
      existing: { current_score: 80, current_level: 'intermediate' },
      percentage: 30,
      passed: false,
      assessment: null,
    })

    // Nothing to write at all: the learner has not un-learned what they showed.
    expect(update).toBeNull()
  })

  it('still promotes on a retake that passes but scores lower than the best', () => {
    const update = resolveSkillUpdate({
      existing: { current_score: 95, current_level: 'beginner' },
      percentage: 75,
      passed: true,
      assessment: { target_level: 'intermediate' },
    })

    expect(update).toMatchObject({ current_score: 95, current_level: 'intermediate' })
  })

  it('writes a first row for a learner with no skill record', () => {
    const update = resolveSkillUpdate({
      existing: null,
      percentage: 0,
      passed: false,
      assessment: null,
    })

    expect(update).toEqual({ current_score: 0 })
  })
})
