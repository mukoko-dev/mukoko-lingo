import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  UILanguageProvider,
  useUILanguage,
  UI_LANGUAGES,
} from '../useUILanguage'

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}))

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UILanguageProvider>{children}</UILanguageProvider>
)

describe('useUILanguage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('defaults to English when no saved preference', () => {
    const { result } = renderHook(() => useUILanguage(), { wrapper })
    expect(result.current.uiLanguage).toBe('en')
  })

  it('loads saved language from AsyncStorage', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('sn')

    const { result } = renderHook(() => useUILanguage(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.uiLanguage).toBe('sn')
  })

  it('saves language to AsyncStorage when changed', async () => {
    const { result } = renderHook(() => useUILanguage(), { wrapper })

    await act(async () => {
      await result.current.setUILanguage('zh')
    })

    // Wait for state update
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      '@mukoko_ui_language',
      'zh'
    )
  })

  it('provides correct language option details', () => {
    const { result } = renderHook(() => useUILanguage(), { wrapper })

    expect(result.current.uiLanguageOption).toEqual(
      expect.objectContaining({
        key: 'en',
        name: 'English',
        nativeName: 'English',
      })
    )
  })

  it('provides translation object', () => {
    const { result } = renderHook(() => useUILanguage(), { wrapper })

    expect(result.current.t).toBeDefined()
    expect(result.current.t.english).toBe('English')
  })

  it('provides fallback when used outside provider', () => {
    const { result } = renderHook(() => useUILanguage())

    expect(result.current.uiLanguage).toBe('en')
    expect(result.current.uiLanguageOption.name).toBe('English')
    expect(result.current.t).toBeDefined()
  })

  it('ignores invalid saved values and detects system language', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid_lang')

    const { result } = renderHook(() => useUILanguage(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should detect system language or fall back to English
    expect(['en', 'sn', 'nd', 'sw', 'zh']).toContain(result.current.uiLanguage)
  })
})

describe('UI_LANGUAGES', () => {
  it('contains 5 languages', () => {
    expect(UI_LANGUAGES).toHaveLength(5)
  })

  it('contains en, sn, nd, sw, zh', () => {
    const keys = UI_LANGUAGES.map(l => l.key)
    expect(keys).toContain('en')
    expect(keys).toContain('sn')
    expect(keys).toContain('nd')
    expect(keys).toContain('sw')
    expect(keys).toContain('zh')
  })

  it('each language has required fields', () => {
    UI_LANGUAGES.forEach(lang => {
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
