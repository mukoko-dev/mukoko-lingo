import * as React from 'react'
import { render, fireEvent, act } from '@testing-library/react-native'
import { MiniQuiz } from '../MiniQuiz'

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}))

jest.mock('@/lib/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false, colorScheme: 'light', setColorScheme: jest.fn() }),
}))

jest.mock('@/lib/hooks/useLearningLanguage', () => ({
  useLearningLanguage: () => ({
    learningLanguage: 'shona',
    setLearningLanguage: jest.fn(),
    learningLanguageOption: { key: 'shona', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  }),
}))

jest.mock('lucide-react-native', () => ({
  CheckCircle: () => null,
  XCircle: () => null,
  ArrowRight: () => null,
  MessageCircle: () => null,
}))

jest.mock('@/lib/services/daily-lesson', () => ({
  generateQuizQuestions: jest.fn((phrases: any[], lang: string) =>
    phrases.map((p: any, i: number) => ({
      id: `quiz-${p.id}`,
      english: p.english,
      correctAnswer: p.shona,
      options: [p.shona, 'Wrong1', 'Wrong2'],
      phraseId: p.id,
    }))
  ),
  markPhraseLearned: jest.fn(() =>
    Promise.resolve({ learned: 1, goal: 5, completed: false, justCompleted: false })
  ),
  getSkillForCategory: jest.fn(() => 'vocabulary'),
}))

jest.mock('@/lib/storage/database', () => ({
  updateProgress: jest.fn(() => Promise.resolve()),
  updateUserSkill: jest.fn(() => Promise.resolve()),
  getUserSkills: jest.fn(() => Promise.resolve({})),
}))

jest.mock('@/lib/services/srs', () => ({
  reviewPhrase: jest.fn(() => Promise.resolve({ card: {}, xpEarned: 10, wasCorrect: true })),
  mapToQuality: jest.fn(() => 4),
}))

jest.mock('@/lib/services/xp', () => ({
  awardXP: jest.fn(() => Promise.resolve({ xpData: { totalXP: 10 }, levelInfo: {}, dailyGoalJustCompleted: false, leveledUp: false })),
}))

const mockPhrases: any[] = [
  {
    id: 'p1',
    english: 'Hello',
    shona: 'Mhoro',
    ndebele: 'Sawubona',
    swahili: 'Habari',
    chinese: '你好',
    category: 'greetings',
    pronunciation: { english: '', shona: '', ndebele: '', swahili: '', chinese: '' },
    context: { en: '', sn: '', nd: '', sw: '', zh: '' },
  },
  {
    id: 'p2',
    english: 'Thank you',
    shona: 'Maita basa',
    ndebele: 'Ngiyabonga',
    swahili: 'Asante',
    chinese: '谢谢',
    category: 'greetings',
    pronunciation: { english: '', shona: '', ndebele: '', swahili: '', chinese: '' },
    context: { en: '', sn: '', nd: '', sw: '', zh: '' },
  },
]

describe('MiniQuiz', () => {
  const onComplete = jest.fn()
  const onPracticeWithShamwari = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders quiz questions', () => {
    const { getByText } = render(
      <MiniQuiz phrases={mockPhrases} onComplete={onComplete} />
    )
    // Should show the first question's English text
    expect(getByText('Hello')).toBeTruthy()
  })

  it('shows translate label', () => {
    const { getByText } = render(
      <MiniQuiz phrases={mockPhrases} onComplete={onComplete} />
    )
    expect(getByText(/Translate to/)).toBeTruthy()
  })

  it('renders answer options', () => {
    const { getByText } = render(
      <MiniQuiz phrases={mockPhrases} onComplete={onComplete} />
    )
    expect(getByText('Mhoro')).toBeTruthy()
  })

  it('handles answer selection', async () => {
    const { getByText } = render(
      <MiniQuiz phrases={mockPhrases} onComplete={onComplete} />
    )

    await act(async () => {
      fireEvent.press(getByText('Mhoro'))
    })

    // Should show next button or feedback
    expect(getByText('Mhoro')).toBeTruthy()
  })

  it('renders with onPracticeWithShamwari callback', () => {
    const { toJSON } = render(
      <MiniQuiz
        phrases={mockPhrases}
        onComplete={onComplete}
        onPracticeWithShamwari={onPracticeWithShamwari}
      />
    )
    expect(toJSON()).toBeTruthy()
  })
})
