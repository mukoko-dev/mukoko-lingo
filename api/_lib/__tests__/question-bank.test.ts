/**
 * The question bank, which now lives server-side because it carries every
 * `correctAnswer`. Scoring moved to `assessment-grading.ts`, so the old
 * `calculateAssessmentScore` cases live there instead.
 */

import type { ProficiencyLevel, SkillName } from '../../../lib/types/skills'
import {
  assessmentQuestions,
  getQuestionsForSkill,
  getDiagnosticQuestions,
  questionsByIds,
  toPublicQuestion,
} from '../question-bank'

const SKILLS: SkillName[] = ['pronunciation', 'vocabulary', 'grammar', 'comprehension', 'conversation']
const LANGUAGES = ['shona', 'ndebele', 'swahili', 'chinese']

describe('question-bank', () => {
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

  describe('coverage', () => {
    // `MIN_QUESTIONS` in assessment-session.ts is 3, so a cell with fewer than
    // that cannot fill a quiz and the learner silently gets a shorter one —
    // which the difficulty cap then reads as weaker evidence. Coverage is a
    // property of the bank, not of the code that draws from it.
    const MIN_PER_CELL = 3

    it.each(['intermediate', 'advanced'] as ProficiencyLevel[])(
      'can fill a %s quiz for every skill in every language',
      (level) => {
        const thin: string[] = []
        for (const language of LANGUAGES) {
          for (const skill of SKILLS) {
            const available = getQuestionsForSkill(skill, level, language, 999).length
            if (available < MIN_PER_CELL) thin.push(`${language}/${skill}: ${available}`)
          }
        }

        expect(thin).toEqual([])
      }
    )

    it('offers enough beginner questions for a diagnostic in each language', () => {
      // Diagnostics draw only beginner questions, and score every skill they
      // touch — a one-question sample is what the difficulty cap exists to
      // contain.
      for (const language of LANGUAGES) {
        expect(getDiagnosticQuestions(language, 99).length).toBeGreaterThanOrEqual(MIN_PER_CELL)
      }
    })

    it('labels every question with a known level', () => {
      const levels = new Set(assessmentQuestions.map((q) => q.level))

      expect([...levels].sort()).toEqual(
        ['advanced', 'beginner', 'elementary', 'fluent', 'intermediate'].filter((l) => levels.has(l as ProficiencyLevel))
      )
      // An unknown or missing level silently caps a score at the beginner
      // ceiling, so it must never happen quietly.
      expect(assessmentQuestions.every((q) => typeof q.level === 'string' && q.level.length > 0)).toBe(true)
    })
  })

  describe('toPublicQuestion', () => {
    it('removes the answer and the explanation', () => {
      // The whole point of moving this module: what crosses to a client must
      // not let the learner answer without knowing anything.
      const pub = toPublicQuestion(assessmentQuestions[0]) as unknown as Record<string, unknown>

      // The key set, not a substring search: for multiple choice the correct
      // answer is necessarily one of the options. What must not survive is any
      // way to tell *which* option it is.
      expect(Object.keys(pub).sort()).toEqual(
        ['id', 'language', 'level', 'options', 'question', 'skill', 'type']
      )
      expect(pub.options).toEqual(assessmentQuestions[0].options)
    })

    it('keeps everything needed to answer', () => {
      const pub = toPublicQuestion(assessmentQuestions[0])

      expect(pub.id).toBe(assessmentQuestions[0].id)
      expect(pub.question).toBe(assessmentQuestions[0].question)
      expect(pub.skill).toBe(assessmentQuestions[0].skill)
      expect(pub.type).toBe(assessmentQuestions[0].type)
    })
  })

  describe('questionsByIds', () => {
    it('returns the questions in the order they were issued', () => {
      const ids = [assessmentQuestions[2].id, assessmentQuestions[0].id]

      expect(questionsByIds(ids).map(q => q.id)).toEqual(ids)
    })

    it('drops ids the bank no longer has', () => {
      // A session issued before a bank edit must not resolve to undefined
      // entries that would then be graded as unanswerable.
      expect(questionsByIds(['nope', assessmentQuestions[0].id]).map(q => q.id)).toEqual([
        assessmentQuestions[0].id,
      ])
    })
  })
})
