import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  LearningLanguageProvider,
  useLearningLanguage,
  LEARNING_LANGUAGES,
} from '../useLearningLanguage'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LearningLanguageProvider>{children}</LearningLanguageProvider>
)

describe('useLearningLanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('defaults to shona when no saved preference', () => {
    const { result } = renderHook(() => useLearningLanguage(), { wrapper })
    expect(result.current.learningLanguage).toBe('shona')
  })

  it('loads saved language from AsyncStorage', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('ndebele')

    const { result } = renderHook(() => useLearningLanguage(), { wrapper })

    // Wait for async load
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.learningLanguage).toBe('ndebele')
  })

  it('saves language to AsyncStorage when changed', async () => {
    const { result } = renderHook(() => useLearningLanguage(), { wrapper })

    await act(async () => {
      result.current.setLearningLanguage('chinese')
    })

    expect(result.current.learningLanguage).toBe('chinese')
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@mukoko_learning_language',
      'chinese'
    )
  })

  it('provides correct language option details', () => {
    const { result } = renderHook(() => useLearningLanguage(), { wrapper })

    expect(result.current.learningLanguageOption).toEqual(
      expect.objectContaining({
        key: 'shona',
        name: 'Shona',
        nativeName: 'chiShona',
        flag: expect.any(String),
      })
    )
  })

  it('provides fallback when used outside provider', () => {
    const { result } = renderHook(() => useLearningLanguage())

    expect(result.current.learningLanguage).toBe('shona')
    expect(result.current.learningLanguageOption.name).toBe('Shona')
  })

  it('ignores invalid saved values', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid_language')

    const { result } = renderHook(() => useLearningLanguage(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should remain default
    expect(result.current.learningLanguage).toBe('shona')
  })
})

describe('LEARNING_LANGUAGES', () => {
  it('contains 4 languages', () => {
    expect(LEARNING_LANGUAGES).toHaveLength(4)
  })

  it('contains shona, ndebele, swahili, chinese', () => {
    const keys = LEARNING_LANGUAGES.map(l => l.key)
    expect(keys).toContain('shona')
    expect(keys).toContain('ndebele')
    expect(keys).toContain('swahili')
    expect(keys).toContain('chinese')
  })

  it('each language has required fields', () => {
    LEARNING_LANGUAGES.forEach(lang => {
      expect(lang).toHaveProperty('key')
      expect(lang).toHaveProperty('name')
      expect(lang).toHaveProperty('nativeName')
      expect(lang).toHaveProperty('flag')
      expect(typeof lang.key).toBe('string')
      expect(typeof lang.name).toBe('string')
      expect(typeof lang.nativeName).toBe('string')
      expect(typeof lang.flag).toBe('string')
    })
  })
})
