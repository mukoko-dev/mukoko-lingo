"use client"

import { useState, useMemo, useEffect } from "react"
import { CategoryNav } from "@/components/category-nav"
import { PhraseComparison } from "@/components/phrase-comparison"
import { SearchBar } from "@/components/search-bar"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Phrase } from "@/lib/phrases-data"
import { translations, type UILanguage } from "@/lib/translations"
import { createClient } from "@/lib/supabase/client"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useUILanguage } from "@/lib/hooks/use-ui-language"

interface BrowseClientProps {
  initialPhrases: Phrase[]
  initialBookmarks: string[]
  initialProgressMap: Record<string, "learning" | "practiced" | "mastered">
  user: any
}

export function BrowseClient({ initialPhrases, initialBookmarks, initialProgressMap, user }: BrowseClientProps) {
  const [activeCategory, setActiveCategory] = useState("greetings")
  const { uiLanguage } = useUILanguage()
  const [bookmarkedPhrases, setBookmarkedPhrases] = useState<string[]>(initialBookmarks)
  const [searchQuery, setSearchQuery] = useState("")
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const [progressMap, setProgressMap] = useState<Record<string, "learning" | "practiced" | "mastered">>(initialProgressMap)
  const supabase = createClient()

  const t = translations[uiLanguage]

  useEffect(() => {
    if (user) {
      loadBookmarks()
      loadProgress()
    }
  }, [user])

  const loadBookmarks = async () => {
    const { data } = await supabase.from("bookmarks").select("phrase_id").eq("user_id", user.id)

    if (data) {
      setBookmarkedPhrases(data.map((row) => row.phrase_id))
    }
  }

  const loadProgress = async () => {
    const { data } = await supabase.from("phrase_progress").select("phrase_id, status").eq("user_id", user.id)

    if (data) {
      const map: Record<string, "learning" | "practiced" | "mastered"> = {}
      data.forEach((row) => {
        map[row.phrase_id] = row.status as "learning" | "practiced" | "mastered"
      })
      setProgressMap(map)
    }
  }

  const filteredPhrases = useMemo(() => {
    let categoryPhrases = initialPhrases.filter((p) => p.category === activeCategory)

    if (showBookmarksOnly) {
      categoryPhrases = categoryPhrases.filter((p) => bookmarkedPhrases.includes(p.id))
    }

    if (!searchQuery.trim()) {
      return categoryPhrases
    }

    const query = searchQuery.toLowerCase()
    return categoryPhrases.filter((phrase) => {
      return (
        phrase.english.toLowerCase().includes(query) ||
        phrase.shona.toLowerCase().includes(query) ||
        phrase.ndebele.toLowerCase().includes(query) ||
        phrase.chinese.toLowerCase().includes(query) ||
        phrase.pronunciation.english.toLowerCase().includes(query) ||
        phrase.pronunciation.shona.toLowerCase().includes(query) ||
        phrase.pronunciation.ndebele.toLowerCase().includes(query) ||
        phrase.pronunciation.chinese.toLowerCase().includes(query) ||
        phrase.context.en.toLowerCase().includes(query) ||
        phrase.context.sn.toLowerCase().includes(query) ||
        phrase.context.nd.toLowerCase().includes(query) ||
        phrase.context.zh.toLowerCase().includes(query)
      )
    })
  }, [initialPhrases, activeCategory, searchQuery, showBookmarksOnly, bookmarkedPhrases])

  const toggleBookmark = async (phraseId: string) => {
    if (!user) return

    const isCurrentlyBookmarked = bookmarkedPhrases.includes(phraseId)

    // Optimistic update
    if (isCurrentlyBookmarked) {
      setBookmarkedPhrases((prev) => prev.filter((id) => id !== phraseId))
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("phrase_id", phraseId)
    } else {
      setBookmarkedPhrases((prev) => [...prev, phraseId])
      await supabase.from("bookmarks").insert({ user_id: user.id, phrase_id: phraseId })
    }
  }

  const handleProgressUpdate = async (phraseId: string, status: "learning" | "practiced" | "mastered") => {
    if (!user) return

    const existingStatus = progressMap[phraseId]

    // Optimistic update
    setProgressMap((prev) => ({ ...prev, [phraseId]: status }))

    if (existingStatus) {
      const { data: currentProgress } = await supabase
        .from("phrase_progress")
        .select("times_practiced")
        .eq("user_id", user.id)
        .eq("phrase_id", phraseId)
        .single()

      const timesPracticed = currentProgress?.times_practiced || 0

      await supabase
        .from("phrase_progress")
        .update({
          status,
          times_practiced: timesPracticed + 1,
        })
        .eq("user_id", user.id)
        .eq("phrase_id", phraseId)
    } else {
      await supabase.from("phrase_progress").insert({
        user_id: user.id,
        phrase_id: phraseId,
        status,
        times_practiced: 1,
      })
    }

    // Update study session
    const today = new Date().toISOString().split("T")[0]
    const { data: existing } = await supabase
      .from("study_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("session_date", today)
      .single()

    if (existing) {
      await supabase
        .from("study_sessions")
        .update({
          phrases_studied: existing.phrases_studied + 1,
        })
        .eq("id", existing.id)
    } else {
      await supabase.from("study_sessions").insert({
        user_id: user.id,
        session_date: today,
        phrases_studied: 1,
        time_spent_minutes: 1,
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Browse Phrases
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Learn Shona, Ndebele, English & Chinese phrases. Track your progress as you learn.
            </p>
          </div>

          <section className="mb-4">
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} uiLanguage={uiLanguage} />
          </section>

          <CategoryNav activeCategory={activeCategory} onCategoryChange={setActiveCategory} uiLanguage={uiLanguage} />

          {user && bookmarkedPhrases.length > 0 && (
            <section className="py-3">
              <Button
                variant={showBookmarksOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
              >
                <Bookmark className="mr-2 h-4 w-4" />
                {showBookmarksOnly ? t.showAll || "Show All" : t.showBookmarks || "Show Bookmarks"} (
                {bookmarkedPhrases.length})
              </Button>
            </section>
          )}

          <main className="py-4">
            {filteredPhrases.length === 0 ? (
              <div className="text-center py-8 px-3">
                <p className="text-lg text-muted-foreground">{t.noResults || "No phrases found matching your search."}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {showBookmarksOnly
                    ? t.noBookmarks || "No bookmarked phrases in this category."
                    : t.tryDifferent || "Try a different search term or browse categories."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredPhrases.map((phrase) => (
                  <PhraseComparison
                    key={phrase.id}
                    phrase={phrase}
                    isBookmarked={bookmarkedPhrases.includes(phrase.id)}
                    onToggleBookmark={() => toggleBookmark(phrase.id)}
                    uiLanguage={uiLanguage}
                    progressStatus={user ? progressMap[phrase.id] || null : null}
                    onProgressUpdate={user ? (status) => handleProgressUpdate(phrase.id, status) : undefined}
                  />
                ))}
              </div>
            )}
          </main>
        </div>
      </SidebarLayout>
    </div>
  )
}
