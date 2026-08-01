import {
  getUserSkillsProficiencyMap,
  getAITutorContext,
  buildSkillsAwarePrompt,
  getUserOverallProficiency,
} from '../skills-aware-prompts'

import { getUserSkills } from '../../storage/database'

// Mock the storage module
jest.mock('../../storage/database', () => ({
  getUserSkills: jest.fn(),
}))

const mockedGetUserSkills = getUserSkills as jest.MockedFunction<typeof getUserSkills>

describe('skills-aware-prompts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserSkillsProficiencyMap', () => {
    it('returns beginner defaults when no skills exist', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const map = await getUserSkillsProficiencyMap()

      expect(map.pronunciation).toEqual({ level: 'beginner', score: 0 })
      expect(map.vocabulary).toEqual({ level: 'beginner', score: 0 })
      expect(map.grammar).toEqual({ level: 'beginner', score: 0 })
      expect(map.comprehension).toEqual({ level: 'beginner', score: 0 })
      expect(map.conversation).toEqual({ level: 'beginner', score: 0 })
    })

    it('maps scores to correct proficiency levels', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 95, lastAssessed: '2026-01-01' },
        vocabulary: { score: 82, lastAssessed: '2026-01-01' },
        grammar: { score: 70, lastAssessed: '2026-01-01' },
        comprehension: { score: 55, lastAssessed: '2026-01-01' },
        conversation: { score: 30, lastAssessed: '2026-01-01' },
      })

      const map = await getUserSkillsProficiencyMap()

      expect(map.pronunciation?.level).toBe('fluent')       // 90+
      expect(map.vocabulary?.level).toBe('advanced')         // 80-89
      expect(map.grammar?.level).toBe('intermediate')        // 65-79
      expect(map.comprehension?.level).toBe('elementary')    // 50-64
      expect(map.conversation?.level).toBe('beginner')       // 0-49
    })

    it('fills in missing skills with beginner defaults', async () => {
      mockedGetUserSkills.mockResolvedValue({
        vocabulary: { score: 75, lastAssessed: '2026-01-01' },
      })

      const map = await getUserSkillsProficiencyMap()

      expect(map.vocabulary?.level).toBe('intermediate')
      expect(map.pronunciation).toEqual({ level: 'beginner', score: 0 })
      expect(map.grammar).toEqual({ level: 'beginner', score: 0 })
      expect(map.comprehension).toEqual({ level: 'beginner', score: 0 })
      expect(map.conversation).toEqual({ level: 'beginner', score: 0 })
    })

    it('handles boundary scores correctly', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 90, lastAssessed: '2026-01-01' },  // exactly fluent
        vocabulary: { score: 80, lastAssessed: '2026-01-01' },     // exactly advanced
        grammar: { score: 65, lastAssessed: '2026-01-01' },        // exactly intermediate
        comprehension: { score: 50, lastAssessed: '2026-01-01' },  // exactly elementary
        conversation: { score: 49, lastAssessed: '2026-01-01' },   // just below elementary
      })

      const map = await getUserSkillsProficiencyMap()

      expect(map.pronunciation?.level).toBe('fluent')
      expect(map.vocabulary?.level).toBe('advanced')
      expect(map.grammar?.level).toBe('intermediate')
      expect(map.comprehension?.level).toBe('elementary')
      expect(map.conversation?.level).toBe('beginner')
    })
  })

  describe('getAITutorContext', () => {
    it('returns context with all 5 skills', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const context = await getAITutorContext()

      expect(context.user_id).toBe('local')
      expect(context.skills).toHaveLength(5)
      expect(context.recent_assessments).toEqual([])
    })

    it('calculates overall proficiency as average', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 80, lastAssessed: '2026-01-01' },
        vocabulary: { score: 80, lastAssessed: '2026-01-01' },
        grammar: { score: 80, lastAssessed: '2026-01-01' },
        comprehension: { score: 80, lastAssessed: '2026-01-01' },
        conversation: { score: 80, lastAssessed: '2026-01-01' },
      })

      const context = await getAITutorContext()

      expect(context.overall_proficiency).toBe('advanced')
    })

    it('marks skills needing improvement (below 65)', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 90, lastAssessed: '2026-01-01' },
        vocabulary: { score: 40, lastAssessed: '2026-01-01' },
        grammar: { score: 30, lastAssessed: '2026-01-01' },
        comprehension: { score: 70, lastAssessed: '2026-01-01' },
        conversation: { score: 60, lastAssessed: '2026-01-01' },
      })

      const context = await getAITutorContext()

      const vocabSkill = context.skills.find(s => s.skill_name === 'vocabulary')
      const grammarSkill = context.skills.find(s => s.skill_name === 'grammar')
      const pronSkill = context.skills.find(s => s.skill_name === 'pronunciation')
      const convSkill = context.skills.find(s => s.skill_name === 'conversation')

      expect(vocabSkill?.needs_improvement).toBe(true)
      expect(grammarSkill?.needs_improvement).toBe(true)
      expect(pronSkill?.needs_improvement).toBe(false)
      expect(convSkill?.needs_improvement).toBe(true)
    })
  })

  describe('buildSkillsAwarePrompt', () => {
    it('returns a non-empty string', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(100)
    })

    it('includes Shamwari identity', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('Shamwari')
      expect(prompt).toContain('friend')
    })

    it('includes the target language', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('practice', 'Ndebele')

      expect(prompt).toContain('NDEBELE')
    })

    it('includes proficiency levels for all skills', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 90, lastAssessed: '2026-01-01' },
        vocabulary: { score: 50, lastAssessed: '2026-01-01' },
      })

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('PRONUNCIATION')
      expect(prompt).toContain('VOCABULARY')
      expect(prompt).toContain('GRAMMAR')
      expect(prompt).toContain('COMPREHENSION')
      expect(prompt).toContain('CONVERSATION')
    })

    it('includes conversation type guidance for practice', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('Free Practice')
    })

    it('includes conversation type guidance for scenario', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('scenario', 'Shona')

      expect(prompt).toContain('Real-World Scenario')
    })

    it('includes conversation type guidance for translation help', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('translation_help', 'Shona')

      expect(prompt).toContain('Translation Assistance')
    })

    it('adapts vocabulary guidance for beginner', async () => {
      mockedGetUserSkills.mockResolvedValue({
        vocabulary: { score: 20, lastAssessed: '2026-01-01' },
      })

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('simple vocabulary')
    })

    it('adapts vocabulary guidance for fluent', async () => {
      mockedGetUserSkills.mockResolvedValue({
        vocabulary: { score: 95, lastAssessed: '2026-01-01' },
      })

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('native-level')
    })

    it('flags weak skills needing attention', async () => {
      mockedGetUserSkills.mockResolvedValue({
        grammar: { score: 30, lastAssessed: '2026-01-01' },
      })

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('SKILLS NEEDING ATTENTION')
      expect(prompt).toContain('GRAMMAR')
    })

    it('shows positive message when all skills are solid', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 80, lastAssessed: '2026-01-01' },
        vocabulary: { score: 80, lastAssessed: '2026-01-01' },
        grammar: { score: 80, lastAssessed: '2026-01-01' },
        comprehension: { score: 80, lastAssessed: '2026-01-01' },
        conversation: { score: 80, lastAssessed: '2026-01-01' },
      })

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('solid proficiency')
    })

    it('includes all supported languages', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const prompt = await buildSkillsAwarePrompt('practice', 'Shona')

      expect(prompt).toContain('Shona')
      expect(prompt).toContain('Ndebele')
      expect(prompt).toContain('Swahili')
      expect(prompt).toContain('Chinese')
    })
  })

  describe('getUserOverallProficiency', () => {
    it('returns beginner for new user', async () => {
      mockedGetUserSkills.mockResolvedValue({})

      const level = await getUserOverallProficiency()

      expect(level).toBe('beginner')
    })

    it('returns fluent when all skills are high', async () => {
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 95, lastAssessed: '2026-01-01' },
        vocabulary: { score: 95, lastAssessed: '2026-01-01' },
        grammar: { score: 95, lastAssessed: '2026-01-01' },
        comprehension: { score: 95, lastAssessed: '2026-01-01' },
        conversation: { score: 95, lastAssessed: '2026-01-01' },
      })

      const level = await getUserOverallProficiency()

      expect(level).toBe('fluent')
    })

    it('averages across all skills', async () => {
      // avg = (100 + 0 + 0 + 0 + 0) / 5 = 20 -> beginner
      mockedGetUserSkills.mockResolvedValue({
        pronunciation: { score: 100, lastAssessed: '2026-01-01' },
      })

      const level = await getUserOverallProficiency()

      expect(level).toBe('beginner')
    })
  })
})
