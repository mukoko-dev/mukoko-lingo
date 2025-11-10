"use client"

import { useState, useEffect } from "react"
import type { UILanguage } from "@/lib/translations"

const UI_LANGUAGE_KEY = "nyuchi-ui-language"

export function useUILanguage() {
  const [uiLanguage, setUILanguageState] = useState<UILanguage>("en")
  const [mounted, setMounted] = useState(false)

  // Load language from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem(UI_LANGUAGE_KEY) as UILanguage | null
    if (stored && ["en", "sn", "nd", "zh"].includes(stored)) {
      setUILanguageState(stored)
    }
  }, [])

  // Update localStorage when language changes
  const setUILanguage = (lang: UILanguage) => {
    setUILanguageState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem(UI_LANGUAGE_KEY, lang)
    }
  }

  return {
    uiLanguage,
    setUILanguage,
    mounted,
  }
}
