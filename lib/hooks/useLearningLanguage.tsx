import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const LEARNING_LANGUAGE_KEY = '@mukoko_learning_language'

export type LearningLanguage = 'shona' | 'ndebele' | 'swahili' | 'chinese'

export interface LearningLanguageOption {
  key: LearningLanguage
  name: string
  nativeName: string
  flag: string
}

export const LEARNING_LANGUAGES: LearningLanguageOption[] = [
  { key: 'shona', name: 'Shona', nativeName: 'chiShona', flag: '🇿🇼' },
  { key: 'ndebele', name: 'Ndebele', nativeName: 'isiNdebele', flag: '🇿🇼' },
  { key: 'swahili', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇰🇪' },
  { key: 'chinese', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
]

interface LearningLanguageContextType {
  learningLanguage: LearningLanguage
  setLearningLanguage: (language: LearningLanguage) => void
  learningLanguageOption: LearningLanguageOption
}

const LearningLanguageContext = createContext<LearningLanguageContextType | undefined>(undefined)

export function LearningLanguageProvider({ children }: { children: ReactNode }) {
  const [learningLanguage, setLearningLanguageState] = useState<LearningLanguage>('shona')

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const saved = await AsyncStorage.getItem(LEARNING_LANGUAGE_KEY)
        if (saved && ['shona', 'ndebele', 'swahili', 'chinese'].includes(saved)) {
          setLearningLanguageState(saved as LearningLanguage)
        }
      } catch (error) {
        console.error('Error loading learning language preference:', error)
      }
    }
    loadPreference()
  }, [])

  const setLearningLanguage = useCallback(async (language: LearningLanguage) => {
    setLearningLanguageState(language)
    try {
      await AsyncStorage.setItem(LEARNING_LANGUAGE_KEY, language)
    } catch (error) {
      console.error('Error saving learning language preference:', error)
    }
  }, [])

  const learningLanguageOption = LEARNING_LANGUAGES.find(l => l.key === learningLanguage) || LEARNING_LANGUAGES[0]

  return (
    <LearningLanguageContext.Provider value={{ learningLanguage, setLearningLanguage, learningLanguageOption }}>
      {children}
    </LearningLanguageContext.Provider>
  )
}

export function useLearningLanguage(): LearningLanguageContextType {
  const context = useContext(LearningLanguageContext)
  if (context === undefined) {
    // Fallback when used outside provider
    return {
      learningLanguage: 'shona',
      setLearningLanguage: () => {},
      learningLanguageOption: LEARNING_LANGUAGES[0],
    }
  }
  return context
}
