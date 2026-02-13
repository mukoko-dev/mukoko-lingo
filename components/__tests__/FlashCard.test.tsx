import * as React from 'react'
import { render } from '@testing-library/react-native'
import { FlashCard } from '../FlashCard'

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}))

jest.mock('@/lib/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false, colorScheme: 'light', setColorScheme: jest.fn() }),
}))

jest.mock('lucide-react-native', () => ({
  RotateCcw: () => null,
  Volume2: () => null,
  Check: () => null,
}))

const mockPhrase = {
  id: 'test-1',
  english: 'Hello',
  shona: 'Mhoro',
  ndebele: 'Sawubona',
  swahili: 'Habari',
  chinese: '你好',
  category: 'greetings',
  pronunciation: {
    english: 'heh-LOH',
    shona: 'muh-hoh-roh',
    ndebele: 'sah-woo-boh-nah',
    swahili: 'hah-BAH-ree',
    chinese: 'nǐ hǎo',
  },
  context: { en: '', sn: '', nd: '', sw: '', zh: '' },
}

describe('FlashCard', () => {
  const onView = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders English text on front', () => {
    const { getByText } = render(
      <FlashCard phrase={mockPhrase as any} language="shona" isViewed={false} onView={onView} />
    )
    expect(getByText('Hello')).toBeTruthy()
  })

  it('renders with isViewed=true', () => {
    const { toJSON } = render(
      <FlashCard phrase={mockPhrase as any} language="shona" isViewed={true} onView={onView} />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders with different languages', () => {
    const languages = ['shona', 'ndebele', 'chinese'] as const
    languages.forEach(lang => {
      const { toJSON } = render(
        <FlashCard phrase={mockPhrase as any} language={lang} isViewed={false} onView={onView} />
      )
      expect(toJSON()).toBeTruthy()
    })
  })

  it('shows English label on front', () => {
    const { getByText } = render(
      <FlashCard phrase={mockPhrase as any} language="shona" isViewed={false} onView={onView} />
    )
    expect(getByText('English')).toBeTruthy()
  })

  it('shows tap to flip hint', () => {
    const { getByText } = render(
      <FlashCard phrase={mockPhrase as any} language="shona" isViewed={false} onView={onView} />
    )
    expect(getByText('Tap to flip')).toBeTruthy()
  })
})
