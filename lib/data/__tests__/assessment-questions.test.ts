import {
  assessmentQuestions,
  getQuestionsForSkill,
  getDiagnosticQuestions,
  calculateAssessmentScore,
} from '../assessment-questions'

describe('assessment-questions', () => {
  describe('question bank', () => {
    it('contains questions', () => {
      expect(assessmentQuestions.length).toBeGreaterThan(0)
    })

    it('each question has required fields', () => {
      assessmentQuestions.forEach(q => {
        expect(q).toHaveProperty('id')
        expect(q).toHaveProperty('skill')
        expect(q).toHaveProperty('level')
        expect(q).toHaveProperty('type')
        expect(q).toHaveProperty('question')
        expect(q).toHaveProperty('options')
        expect(q).toHaveProperty('correctAnswer')
        expect(q).toHaveProperty('explanation')
        expect(q).toHaveProperty('language')
      })
    })

    it('all question IDs are unique', () => {
      const ids = assessmentQuestions.map(q => q.id)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('correct answer is always in options', () => {
      assessmentQuestions.forEach(q => {
        expect(q.options).toContain(q.correctAnswer)
      })
    })

    it('covers all 5 skills', () => {
      const skills = new Set(assessmentQuestions.map(q => q.skill))
      expect(skills).toContain('pronunciation')
      expect(skills).toContain('vocabulary')
      expect(skills).toContain('grammar')
      expect(skills).toContain('comprehension')
      expect(skills).toContain('conversation')
    })

    it('has questions for multiple languages', () => {
      const languages = new Set(assessmentQuestions.map(q => q.language))
      expect(languages.size).toBeGreaterThanOrEqual(3)
    })
  })

  describe('getQuestionsForSkill', () => {
    it('returns questions for a specific skill', () => {
      const qs = getQuestionsForSkill('vocabulary')
      qs.forEach(q => {
        expect(q.skill).toBe('vocabulary')
      })
    })

    it('respects the count limit', () => {
      const qs = getQuestionsForSkill('vocabulary', 'beginner', undefined, 2)
      expect(qs.length).toBeLessThanOrEqual(2)
    })

    it('filters by language when specified', () => {
      const qs = getQuestionsForSkill('vocabulary', 'beginner', 'shona', 10)
      qs.forEach(q => {
        expect(['shona', 'all']).toContain(q.language)
      })
    })
  })

  describe('getDiagnosticQuestions', () => {
    it('returns beginner-level questions', () => {
      const qs = getDiagnosticQuestions()
      qs.forEach(q => {
        expect(q.level).toBe('beginner')
      })
    })

    it('respects the count limit', () => {
      const qs = getDiagnosticQuestions(undefined, 3)
      expect(qs.length).toBeLessThanOrEqual(3)
    })
  })

  describe('calculateAssessmentScore', () => {
    it('calculates correct score', () => {
      const qs = assessmentQuestions.slice(0, 3)
      const answers: Record<string, string> = {}
      // Answer all correctly
      qs.forEach(q => { answers[q.id] = q.correctAnswer })

      const result = calculateAssessmentScore(qs, answers)
      expect(result.score).toBe(3)
      expect(result.total).toBe(3)
      expect(result.percentage).toBe(100)
      expect(result.results.every(r => r.correct)).toBe(true)
    })

    it('handles wrong answers', () => {
      const qs = assessmentQuestions.slice(0, 2)
      const answers: Record<string, string> = {
        [qs[0].id]: 'wrong answer',
        [qs[1].id]: qs[1].correctAnswer,
      }

      const result = calculateAssessmentScore(qs, answers)
      expect(result.score).toBe(1)
      expect(result.total).toBe(2)
      expect(result.percentage).toBe(50)
    })

    it('handles no answers', () => {
      const qs = assessmentQuestions.slice(0, 2)
      const result = calculateAssessmentScore(qs, {})
      expect(result.score).toBe(0)
      expect(result.percentage).toBe(0)
    })
  })
})
