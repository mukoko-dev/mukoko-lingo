import React from 'react'
import { renderHook, act } from '@testing-library/react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Appearance } from 'react-native'
import { ThemeProvider, useTheme } from '../useTheme'

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
}))

// Mock Appearance
jest.mock('react-native', () => {
  const listeners: ((prefs: { colorScheme: string }) => void)[] = []
  return {
    Appearance: {
      getColorScheme: jest.fn(() => 'light'),
      addChangeListener: jest.fn((listener: (prefs: { colorScheme: string }) => void) => {
        listeners.push(listener)
        return { remove: jest.fn() }
      }),
      // expose for testing
      __listeners: listeners,
    },
    Platform: { OS: 'web' },
  }
})

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

describe('useTheme', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')
  })

  it('defaults to system theme mode', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.themeMode).toBe('system')
  })

  it('resolves system theme to light when system is light', () => {
    ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('light')

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.colorScheme).toBe('light')
    expect(result.current.isDark).toBe(false)
  })

  it('loads saved theme from AsyncStorage', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('dark')

    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.themeMode).toBe('dark')
    expect(result.current.isDark).toBe(true)
  })

  it('ignores invalid saved theme values', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('invalid')

    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    // Should stay on default 'system'
    expect(result.current.themeMode).toBe('system')
  })

  it('setThemeMode saves to AsyncStorage', async () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => {
      result.current.setThemeMode('dark')
    })

    expect(result.current.themeMode).toBe('dark')
    expect(result.current.isDark).toBe(true)
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@mukoko_theme_preference', 'dark')
  })

  it('toggleTheme cycles light -> dark -> system -> light', async () => {
    ;(AsyncStorage.getItem as jest.Mock).mockResolvedValueOnce('light')

    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.themeMode).toBe('light')

    await act(async () => {
      result.current.toggleTheme()
    })
    expect(result.current.themeMode).toBe('dark')

    await act(async () => {
      result.current.toggleTheme()
    })
    expect(result.current.themeMode).toBe('system')

    await act(async () => {
      result.current.toggleTheme()
    })
    expect(result.current.themeMode).toBe('light')
  })

  it('provides fallback when used outside ThemeProvider', () => {
    const { result } = renderHook(() => useTheme())

    // Should not throw, returns fallback values
    expect(result.current.themeMode).toBe('system')
    expect(typeof result.current.setThemeMode).toBe('function')
    expect(typeof result.current.toggleTheme).toBe('function')
  })

  it('explicit light mode overrides system', async () => {
    ;(Appearance.getColorScheme as jest.Mock).mockReturnValue('dark')

    const { result } = renderHook(() => useTheme(), { wrapper })

    await act(async () => {
      result.current.setThemeMode('light')
    })

    expect(result.current.isDark).toBe(false)
    expect(result.current.colorScheme).toBe('light')
  })
})
