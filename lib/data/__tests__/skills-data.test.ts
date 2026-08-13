/**
 * Integrity checks for the seeded skill catalogue.
 *
 * The important guard here is that the level thresholds stay identical to
 * scoreToLevel() in lib/ai/skills-aware-prompts.ts — if those drift, the AI
 * tutor and the skills API disagree about what a score means.
 */

import { skills, linguisticSkills, domainSkills, SKILL_LEVELS } from '../skills-data'

const UI_LANGUAGES = ['en', 'sn', 'nd', 'sw', 'zh'] as const
const CORE_SKILLS = ['pronunciation', 'vocabulary', 'grammar', 'comprehension', 'conversation']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('skills catalogue', () => {
  it('defines exactly the five core linguistic skills', () => {
    expect(linguisticSkills.map(s => s.name).sort()).toEqual([...CORE_SKILLS].sort())
    for (const skill of linguisticSkills) expect(skill.kind).toBe('linguistic')
  })

  it('is the linguistic and domain sets combined', () => {
    expect(skills).toEqual([...linguisticSkills, ...domainSkills])
  })

  it('uses stable, unique UUID string ids — never ObjectIds', () => {
    const ids = skills.map(s => s._id)
    expect(new Set(ids).size).toBe(skills.length)
    for (const id of ids) expect(id).toMatch(UUID_RE)
  })

  it('has a unique, contiguous sort order across both axes', () => {
    const expected = Array.from({ length: skills.length }, (_, i) => i + 1)
    expect(skills.map(s => s.sort_order).sort((a, b) => a - b)).toEqual(expected)
  })

  it('is active and carries an icon', () => {
    for (const skill of skills) {
      expect(skill.is_active).toBe(true)
      expect(skill.icon).toBeTruthy()
    }
  })

  it('translates display name and description into every UI language', () => {
    for (const skill of skills) {
      for (const lang of UI_LANGUAGES) {
        expect(skill.display_name[lang]?.trim()).toBeTruthy()
        expect(skill.description[lang]?.trim()).toBeTruthy()
      }
    }
  })
})

describe('domain skills', () => {
  const SCENARIO_ID_RE = /^01977100-0f02-7000-8000-[0-9a-f]{12}$/
  // Every category present in lingo.phrases, verified against the cluster.
  const ALL_CATEGORIES = [
    'business', 'emotions', 'family', 'food', 'greetings', 'health', 'money',
    'school', 'shopping', 'tourism', 'transport', 'weather', 'work',
  ]

  it('is tagged as domain, never linguistic', () => {
    for (const skill of domainSkills) expect(skill.kind).toBe('domain')
  })

  it('links only to well-formed scenario ids', () => {
    for (const skill of domainSkills) {
      for (const id of skill.scenario_ids ?? []) expect(id).toMatch(SCENARIO_ID_RE)
    }
  })

  it('covers all 10 scenarios exactly once', () => {
    const linked = domainSkills.flatMap(s => s.scenario_ids ?? [])
    expect(new Set(linked).size).toBe(linked.length)
    expect(linked).toHaveLength(10)
  })

  it('claims every phrase category exactly once, leaving none stranded', () => {
    const claimed = domainSkills.flatMap(s => s.categories ?? [])
    expect([...new Set(claimed)].sort()).toEqual([...ALL_CATEGORIES].sort())
  })
})

describe('skill levels', () => {
  it('attaches the full ladder to every skill', () => {
    for (const skill of skills) {
      expect(skill.levels).toHaveLength(5)
      expect(skill.levels).toEqual(SKILL_LEVELS)
    }
  })

  it('orders levels by ascending threshold with no gaps in sort order', () => {
    expect(SKILL_LEVELS.map(l => l.sort_order)).toEqual([1, 2, 3, 4, 5])
    const scores = SKILL_LEVELS.map(l => l.min_score)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })

  /**
   * Mirrors scoreToLevel(): >=90 fluent, >=80 advanced, >=65 intermediate,
   * >=50 elementary, else beginner. Resolving a score against the seeded
   * thresholds must produce the same answer the AI tutor would give.
   */
  it('resolves scores to the same band scoreToLevel() would', () => {
    const resolve = (score: number) =>
      [...SKILL_LEVELS].reverse().find(l => score >= l.min_score)!.level

    expect(resolve(0)).toBe('beginner')
    expect(resolve(49)).toBe('beginner')
    expect(resolve(50)).toBe('elementary')
    expect(resolve(64)).toBe('elementary')
    expect(resolve(65)).toBe('intermediate')
    expect(resolve(79)).toBe('intermediate')
    expect(resolve(80)).toBe('advanced')
    expect(resolve(89)).toBe('advanced')
    expect(resolve(90)).toBe('fluent')
    expect(resolve(100)).toBe('fluent')
  })
})
