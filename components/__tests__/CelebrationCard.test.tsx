import * as React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { CelebrationCard } from '../CelebrationCard'

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}))

jest.mock('@/lib/hooks/useTheme', () => ({
  useTheme: () => ({ isDark: false, colorScheme: 'light', setColorScheme: jest.fn() }),
}))

jest.mock('lucide-react-native', () => ({
  Star: () => null,
  Flame: () => null,
  BookOpen: () => null,
  MessageCircle: () => null,
}))

describe('CelebrationCard', () => {
  const onContinue = jest.fn()
  const onPracticeWithShamwari = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders daily-goal celebration', () => {
    const { getByText } = render(
      <CelebrationCard
        type="daily-goal"
        onContinue={onContinue}
        onPracticeWithShamwari={onPracticeWithShamwari}
      />
    )
    expect(getByText('Daily Goal Complete!')).toBeTruthy()
  })

  it('renders quiz-complete celebration with score', () => {
    const { getByText } = render(
      <CelebrationCard
        type="quiz-complete"
        score={4}
        total={5}
        onContinue={onContinue}
        onPracticeWithShamwari={onPracticeWithShamwari}
      />
    )
    expect(getByText('Outstanding!')).toBeTruthy()
    expect(getByText('You got 4 out of 5 correct')).toBeTruthy()
  })

  it('renders streak celebration', () => {
    const { getByText } = render(
      <CelebrationCard
        type="streak"
        streak={7}
        onContinue={onContinue}
        onPracticeWithShamwari={onPracticeWithShamwari}
      />
    )
    expect(getByText('7 Day Streak!')).toBeTruthy()
  })

  it('shows different messages for different quiz scores', () => {
    const { getByText: getLow } = render(
      <CelebrationCard type="quiz-complete" score={1} total={5} onContinue={onContinue} />
    )
    expect(getLow('Good effort!')).toBeTruthy()

    const { getByText: getMed } = render(
      <CelebrationCard type="quiz-complete" score={3} total={5} onContinue={onContinue} />
    )
    expect(getMed('Well done!')).toBeTruthy()
  })

  it('calls onContinue when continue button pressed', () => {
    const { getByText } = render(
      <CelebrationCard
        type="daily-goal"
        onContinue={onContinue}
        onPracticeWithShamwari={onPracticeWithShamwari}
      />
    )
    fireEvent.press(getByText('Continue Learning'))
    expect(onContinue).toHaveBeenCalled()
  })

  it('calls onPracticeWithShamwari when shamwari button pressed', () => {
    const { getByText } = render(
      <CelebrationCard
        type="daily-goal"
        onContinue={onContinue}
        onPracticeWithShamwari={onPracticeWithShamwari}
      />
    )
    fireEvent.press(getByText('Practice with Shamwari'))
    expect(onPracticeWithShamwari).toHaveBeenCalled()
  })

  it('renders without optional callbacks', () => {
    const { toJSON } = render(
      <CelebrationCard type="daily-goal" />
    )
    expect(toJSON()).toBeTruthy()
  })

  it('renders dismiss button when onDismiss provided', () => {
    const onDismiss = jest.fn()
    const { getByText } = render(
      <CelebrationCard type="daily-goal" onDismiss={onDismiss} onContinue={onContinue} />
    )
    fireEvent.press(getByText('×'))
    expect(onDismiss).toHaveBeenCalled()
  })
})
