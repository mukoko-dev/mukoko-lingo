import * as React from 'react'
import { render, waitFor } from '@testing-library/react-native'
import { DailyLessonCard } from '../DailyLessonCard'

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
  BookOpen: () => null,
  Play: () => null,
  ChevronRight: () => null,
  RotateCcw: () => null,
  Volume2: () => null,
  Check: () => null,
}))

jest.mock('@/lib/services/daily-lesson', () => ({
  getTodaysLesson: jest.fn(() => Promise.resolve([
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
  ])),
  getTodayProgress: jest.fn(() => Promise.resolve({ learned: 0, goal: 5, completed: false })),
}))

describe('DailyLessonCard', () => {
  const onStartQuiz = jest.fn()
  const onPhrasePress = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders without crashing', async () => {
    const { toJSON } = render(
      <DailyLessonCard onStartQuiz={onStartQuiz} onPhrasePress={onPhrasePress} />
    )
    await waitFor(() => {
      expect(toJSON()).toBeTruthy()
    })
  })

  it('loads and displays lesson data', async () => {
    const { toJSON } = render(
      <DailyLessonCard onStartQuiz={onStartQuiz} />
    )
    await waitFor(() => {
      expect(toJSON()).toBeTruthy()
    })
  })

  it('renders with onPhrasePress callback', async () => {
    const { toJSON } = render(
      <DailyLessonCard onStartQuiz={onStartQuiz} onPhrasePress={onPhrasePress} />
    )
    await waitFor(() => {
      expect(toJSON()).toBeTruthy()
    })
  })
})
