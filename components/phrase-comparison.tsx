"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Volume2, Bookmark, Check } from "lucide-react"
import type { Phrase } from "@/lib/phrases-data"
import { translations, type UILanguage } from "@/lib/translations"
import { createClient } from "@/lib/supabase/client"

interface PhraseComparisonProps {
  phrase: Phrase
  isBookmarked: boolean
  onToggleBookmark: () => void
  uiLanguage: UILanguage
  progressStatus?: "learning" | "practiced" | "mastered" | null
  onProgressUpdate?: (status: "learning" | "practiced" | "mastered") => void
}

export function PhraseComparison({
  phrase,
  isBookmarked,
  onToggleBookmark,
  uiLanguage,
  progressStatus,
  onProgressUpdate,
}: PhraseComparisonProps) {
  const t = translations[uiLanguage]
  const supabase = createClient()

  const handleSpeak = async (text: string, lang: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = lang
      utterance.rate = 0.8
      window.speechSynthesis.speak(utterance)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && onProgressUpdate && !progressStatus) {
        onProgressUpdate("learning")
      }
    }
  }

  const handleStatusChange = async (status: "learning" | "practiced" | "mastered") => {
    if (onProgressUpdate) {
      onProgressUpdate(status)
    }
  }

  const languageCards = [
    {
      lang: "english",
      text: phrase.english,
      pronunciation: phrase.pronunciation.english,
      color: "blue",
      speechLang: "en-US",
    },
    {
      lang: "shona",
      text: phrase.shona,
      pronunciation: phrase.pronunciation.shona,
      color: "green",
      speechLang: "sn-ZW",
    },
    {
      lang: "ndebele",
      text: phrase.ndebele,
      pronunciation: phrase.pronunciation.ndebele,
      color: "orange",
      speechLang: "nd-ZW",
    },
    {
      lang: "chinese",
      text: phrase.chinese,
      pronunciation: phrase.pronunciation.chinese,
      color: "red",
      speechLang: "zh-CN",
    },
  ]

  const colorClasses = {
    blue: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    green: "border-green-500/30 bg-green-500/5 hover:bg-green-500/10",
    orange: "border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10",
    red: "border-red-500/30 bg-red-500/5 hover:bg-red-500/10",
  }

  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow"
      role="article"
      aria-label={`Phrase comparison: ${phrase.english}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <Badge variant="secondary" className="mb-1.5">
            {t.categories[phrase.category as keyof typeof t.categories]}
          </Badge>
          <p className="text-sm text-muted-foreground">{phrase.context[uiLanguage]}</p>
        </div>
        <div className="flex items-center gap-2">
          {onProgressUpdate && (
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant={progressStatus === "learning" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleStatusChange("learning")}
                title="Mark as Learning"
              >
                <span className="text-xs">Learning</span>
              </Button>
              <Button
                variant={progressStatus === "practiced" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleStatusChange("practiced")}
                title="Mark as Practiced"
              >
                <span className="text-xs">Practiced</span>
              </Button>
              <Button
                variant={progressStatus === "mastered" ? "default" : "ghost"}
                size="sm"
                onClick={() => handleStatusChange("mastered")}
                className="bg-green-500 hover:bg-green-600"
                title="Mark as Mastered"
              >
                <Check className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleBookmark}
            className={isBookmarked ? "text-primary" : ""}
            aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-current" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {languageCards.map((card) => (
          <div
            key={card.lang}
            className={`rounded-lg border-2 p-3 transition-colors ${colorClasses[card.color as keyof typeof colorClasses]}`}
            role="region"
            aria-label={`${card.lang} translation`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-sm uppercase tracking-wide">
                {card.lang === "english"
                  ? t.english
                  : card.lang === "shona"
                    ? t.shona
                    : card.lang === "ndebele"
                      ? t.ndebele
                      : t.chinese}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-60 hover:opacity-100"
                onClick={() => handleSpeak(card.text, card.speechLang)}
                aria-label={`Play pronunciation for ${card.lang}`}
              >
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-lg font-medium mb-1.5" lang={card.speechLang}>
              {card.text}
            </p>
            <p className="text-xs text-muted-foreground italic">
              <span className="sr-only">{t.pronunciation}: </span>
              {card.pronunciation}
            </p>
          </div>
        ))}
      </div>
    </Card>
  )
}
