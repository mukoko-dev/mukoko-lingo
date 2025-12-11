import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Appearance, ColorSchemeName } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const THEME_STORAGE_KEY = '@nyuchi_theme_preference'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
  colorScheme: ColorSchemeName
  themeMode: ThemeMode
  setThemeMode: (mode: ThemeMode) => void
  toggleTheme: () => void
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system')
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(Appearance.getColorScheme())

  // Load saved theme preference on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY)
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
          setThemeModeState(savedTheme as ThemeMode)
        }
      } catch (error) {
        console.error('Error loading theme preference:', error)
      }
    }
    loadThemePreference()
  }, [])

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme)
    })
    return () => subscription?.remove()
  }, [])

  // Calculate effective color scheme
  const colorScheme: ColorSchemeName = themeMode === 'system' ? systemColorScheme : themeMode

  const isDark = colorScheme === 'dark'

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode)
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch (error) {
      console.error('Error saving theme preference:', error)
    }
  }

  const toggleTheme = () => {
    // Cycle through: light -> dark -> system -> light
    if (themeMode === 'light') {
      setThemeMode('dark')
    } else if (themeMode === 'dark') {
      setThemeMode('system')
    } else {
      setThemeMode('light')
    }
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, themeMode, setThemeMode, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    // Fallback for when used outside provider (shouldn't happen in normal use)
    const systemScheme = Appearance.getColorScheme()
    return {
      colorScheme: systemScheme,
      themeMode: 'system',
      setThemeMode: () => {},
      toggleTheme: () => {},
      isDark: systemScheme === 'dark',
    }
  }
  return context
}
