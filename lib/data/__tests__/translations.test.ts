import { translations, UILanguage } from '../translations'

const SUPPORTED_LANGUAGES: UILanguage[] = ['en', 'sn', 'nd', 'zh', 'sw']

describe('translations', () => {
  it('has all supported languages', () => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      expect(translations).toHaveProperty(lang)
    })
  })

  it('English translations have all required keys', () => {
    const en = translations.en
    const requiredKeys = [
      'heroTitle',
      'heroSubtitle',
      'english',
      'shona',
      'ndebele',
      'chinese',
      'searchPlaceholder',
      'myBookmarks',
      'myProgress',
      'aiPractice',
      'settings',
      'categories',
      // Progress tab / Daily lesson keys
      'navProgress',
      'todaysLesson',
      'browseAll',
      'startPracticeQuiz',
      'flipAllCards',
      'practiceQuiz',
      'practiceWithShamwari',
      'continueLearning',
      'dailyGoalComplete',
      'todaysGoal',
      'dashboard',
      'phrases',
      'dayStreak',
      'saved',
      'overallProficiency',
      'takeAssessment',
      'phraseProgress',
      'noPhraseYet',
      'bookmarkOrPractice',
      'startLearning',
      // Quiz / FlashCard keys
      'translateTo',
      'correct',
      'keepPracticing',
      'excellent',
      'goodJob',
    ]
    requiredKeys.forEach(key => {
      expect(en).toHaveProperty(key)
    })
  })

  it('all languages have the same top-level keys as English', () => {
    const enKeys = Object.keys(translations.en).sort()

    SUPPORTED_LANGUAGES.filter(l => l !== 'en').forEach(lang => {
      const langKeys = Object.keys(translations[lang]).sort()
      expect(langKeys).toEqual(enKeys)
    })
  })

  it('no translation value is empty', () => {
    SUPPORTED_LANGUAGES.forEach(lang => {
      const langObj = translations[lang] as Record<string, unknown>
      Object.entries(langObj).forEach(([key, value]) => {
        if (typeof value === 'string') {
          expect(value.trim().length).toBeGreaterThan(0)
        } else if (typeof value === 'object' && value !== null) {
          // Check nested objects (like categories)
          Object.entries(value as Record<string, string>).forEach(([nestedKey, nestedValue]) => {
            expect(typeof nestedValue).toBe('string')
            expect(nestedValue.trim().length).toBeGreaterThan(0)
          })
        }
      })
    })
  })

  it('categories translations have matching keys across all languages', () => {
    const enCategoryKeys = Object.keys(translations.en.categories).sort()

    SUPPORTED_LANGUAGES.filter(l => l !== 'en').forEach(lang => {
      const langCategoryKeys = Object.keys(translations[lang].categories).sort()
      expect(langCategoryKeys).toEqual(enCategoryKeys)
    })
  })
})
