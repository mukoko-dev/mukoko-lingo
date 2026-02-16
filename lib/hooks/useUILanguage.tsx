import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { type UILanguage, translations } from '@/lib/data/translations'

const UI_LANGUAGE_KEY = '@mukoko_ui_language'

export interface UILanguageOption {
  key: UILanguage
  name: string
  nativeName: string
  flag: string
}

export const UI_LANGUAGES: UILanguageOption[] = [
  { key: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { key: 'sn', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { key: 'nd', name: 'Ndebele', nativeName: 'isiNdebele', flag: '🇿🇼' },
  { key: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { key: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
]

function detectSystemLanguage(): UILanguage {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
      const browserLang = navigator.language || (navigator as any).userLanguage || 'en'
      const langCode = browserLang.split('-')[0].toLowerCase()

      const mapping: Record<string, UILanguage> = {
        sn: 'sn',
        nd: 'nd',
        sw: 'sw',
        zh: 'zh',
      }

      if (mapping[langCode]) return mapping[langCode]
    }
  } catch {
    // Fallback silently
  }
  return 'en'
}

interface UILanguageContextType {
  uiLanguage: UILanguage
  setUILanguage: (language: UILanguage) => void
  uiLanguageOption: UILanguageOption
  t: (typeof translations)['en']
}

const UILanguageContext = createContext<UILanguageContextType | undefined>(undefined)

export function UILanguageProvider({ children }: { children: ReactNode }) {
  const [uiLanguage, setUILanguageState] = useState<UILanguage>('en')

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(UI_LANGUAGE_KEY)
        if (saved && ['en', 'sn', 'nd', 'sw', 'zh'].includes(saved)) {
          setUILanguageState(saved as UILanguage)
        } else {
          // First load - detect system language, default to English
          const detected = detectSystemLanguage()
          setUILanguageState(detected)
          await AsyncStorage.setItem(UI_LANGUAGE_KEY, detected)
        }
      } catch {
        // Default to English on error
      }
    }
    loadPreference()
  }, [])

  const setUILanguage = useCallback(async (language: UILanguage) => {
    setUILanguageState(language)
    try {
      await AsyncStorage.setItem(UI_LANGUAGE_KEY, language)
    } catch {
      // Silently fail
    }
  }, [])

  const uiLanguageOption = UI_LANGUAGES.find(l => l.key === uiLanguage) || UI_LANGUAGES[0]
  const t = translations[uiLanguage] || translations.en

  return (
    <UILanguageContext.Provider value={{ uiLanguage, setUILanguage, uiLanguageOption, t }}>
      {children}
    </UILanguageContext.Provider>
  )
}

export function useUILanguage(): UILanguageContextType {
  const context = useContext(UILanguageContext)
  if (!context) {
    return {
      uiLanguage: 'en',
      setUILanguage: () => {},
      uiLanguageOption: UI_LANGUAGES[0],
      t: translations.en,
    }
  }
  return context
}
