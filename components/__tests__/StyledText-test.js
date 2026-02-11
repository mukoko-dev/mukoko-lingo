import * as React from 'react'
import { render } from '@testing-library/react-native'

import { MonoText } from '../StyledText'

// Mock useColorScheme to avoid ReferenceError during teardown
jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({
  default: jest.fn(() => 'light'),
}))

it('renders correctly', () => {
  const { getByText } = render(<MonoText>Snapshot test!</MonoText>)
  expect(getByText('Snapshot test!')).toBeTruthy()
})
