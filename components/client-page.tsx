"use client"

import { useState, useMemo, useEffect } from "react"
import { CategoryNav } from "@/components/category-nav"
import { PhraseComparison } from "@/components/phrase-comparison"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { SearchBar } from "@/components/search-bar"
import { AuthModal } from "@/components/auth-modal"
import { Bookmark, Users, Sparkles, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Phrase } from "@/lib/phrases-data"
import { translations, type UILanguage } from "@/lib/translations"
import { createClient } from "@/lib/supabase/client"
import { AppHeader } from "@/components/app-header"
import { AppSidebar } from "@/components/app-sidebar"
import { useDevAuth } from "@/lib/hooks/use-dev-auth"
import { useSidebar } from "@/lib/contexts/sidebar-context"

interface ClientPageProps {
  initialPhrases: Phrase[]
  initialBookmarks: string[]
  children?: React.ReactNode
}

export function ClientPage({ initialPhrases, initialBookmarks, children }: ClientPageProps) {
  const [activeCategory, setActiveCategory] = useState("greetings")
  const [uiLanguage, setUILanguage] = useState<UILanguage>("en")
  const [bookmarkedPhrases, setBookmarkedPhrases] = useState<string[]>(initialBookmarks)
  const [searchQuery, setSearchQuery] = useState("")
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false)
  const { user } = useDevAuth()
  const { isCollapsed } = useSidebar()
  const [progressMap, setProgressMap] = useState<Record<string, "learning" | "practiced" | "mastered">>({})
  const [showAuthModal, setShowAuthModal] = useState(false)
  const supabase = createClient()

  const t = translations[uiLanguage]

  useEffect(() => {
    if (user) {
      loadBookmarks()
      loadProgress()
    } else {
      setBookmarkedPhrases([])
      setProgressMap({})
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
    if (!user) {
      setShowAuthModal(true)
      return
    }

    const isBookmarked = bookmarkedPhrases.includes(phraseId)

    if (isBookmarked) {
      const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("phrase_id", phraseId)

      if (!error) {
        setBookmarkedPhrases((prev) => prev.filter((id) => id !== phraseId))
      }
    } else {
      const { error } = await supabase.from("bookmarks").insert({
        user_id: user.id,
        phrase_id: phraseId,
      })

      if (!error) {
        setBookmarkedPhrases((prev) => [...prev, phraseId])
      }
    }
  }

  const trackPhraseView = async (phraseId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("phrase_views").insert({
        user_id: user.id,
        phrase_id: phraseId,
      })

      if (error) {
        console.error("[v0] Error tracking phrase view:", error)
      } else {
        console.log("[v0] Phrase view tracked:", phraseId)
      }
    } catch (error) {
      console.error("[v0] Exception tracking phrase view:", error)
    }
  }

  const updateStudySession = async () => {
    if (!user) return

    try {
      const today = new Date().toISOString().split("T")[0]

      const { data: existing, error: fetchError } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .eq("session_date", today)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("[v0] Error fetching study session:", fetchError)
        return
      }

      if (existing) {
        const { error: updateError } = await supabase
          .from("study_sessions")
          .update({
            phrases_studied: existing.phrases_studied + 1,
          })
          .eq("id", existing.id)

        if (updateError) {
          console.error("[v0] Error updating study session:", updateError)
        } else {
          console.log("[v0] Study session updated, phrases studied:", existing.phrases_studied + 1)
        }
      } else {
        const { error: insertError } = await supabase.from("study_sessions").insert({
          user_id: user.id,
          session_date: today,
          phrases_studied: 1,
          time_spent_minutes: 1,
        })

        if (insertError) {
          console.error("[v0] Error inserting study session:", insertError)
        } else {
          console.log("[v0] New study session created for today")
        }
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          last_study_date: today,
        })
        .eq("user_id", user.id)

      if (profileError) {
        console.error("[v0] Error updating last study date:", profileError)
      } else {
        console.log("[v0] Last study date updated")
      }
    } catch (error) {
      console.error("[v0] Exception updating study session:", error)
    }
  }

  const handleProgressUpdate = async (phraseId: string, status: "learning" | "practiced" | "mastered") => {
    if (!user) {
      setShowAuthModal(true)
      return
    }

    const existingStatus = progressMap[phraseId]

    console.log("[v0] Updating progress for phrase:", phraseId, "to status:", status)
    await trackPhraseView(phraseId)
    await updateStudySession()

    if (existingStatus) {
      const { data: currentProgress, error: fetchError } = await supabase
        .from("phrase_progress")
        .select("times_practiced")
        .eq("user_id", user.id)
        .eq("phrase_id", phraseId)
        .single()

      if (fetchError) {
        console.error("[v0] Error fetching current progress:", fetchError)
      }

      const { error } = await supabase
        .from("phrase_progress")
        .update({
          status,
          times_practiced: (currentProgress?.times_practiced || 0) + 1,
          last_practiced_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .eq("phrase_id", phraseId)

      if (!error) {
        setProgressMap((prev) => ({ ...prev, [phraseId]: status }))
        console.log("[v0] Progress updated successfully")
      } else {
        console.error("[v0] Error updating progress:", error)
      }
    } else {
      const { error } = await supabase.from("phrase_progress").insert({
        user_id: user.id,
        phrase_id: phraseId,
        status,
        times_practiced: 1,
        last_practiced_at: new Date().toISOString(),
      })

      if (!error) {
        setProgressMap((prev) => ({ ...prev, [phraseId]: status }))
        console.log("[v0] New progress record created")
      } else {
        console.error("[v0] Error inserting progress:", error)
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {user && <AppSidebar />}

      <div className={user ? (isCollapsed ? "lg:ml-16 transition-all duration-300" : "lg:ml-64 transition-all duration-300") : ""}>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} uiLanguage={uiLanguage} />

        {!user && <AppHeader uiLanguage={uiLanguage} onLanguageChange={setUILanguage} />}

        <section className="bg-gradient-to-b from-primary/5 to-background py-6 sm:py-10">
          <div className="container mx-auto px-3 sm:px-6 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold mb-2 sm:mb-3 text-balance">
              {t.heroTitle || "Master Zimbabwe's Languages for Travel, Business & Life"}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto text-pretty mb-4 sm:mb-6 px-2">
              {t.heroSubtitle ||
                "Learn Shona, Ndebele, English & Chinese with AI-powered tools. Perfect for tourists exploring Victoria Falls, expats living in Zimbabwe, business professionals, students, immigrants, and locals building multilingual skills."}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                For Everyone
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                AI-Powered Learning
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                200+ Essential Phrases
              </span>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-3 sm:px-6 pb-2 sm:pb-4">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center">
            <div className="flex-1">
              <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} uiLanguage={uiLanguage} />
            </div>
            {user && (
              <Link href="/app/ai-practice">
                <Button variant="default" size="default" className="w-full sm:w-auto whitespace-nowrap">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t.aiTutor || "AI Tutor"}
                </Button>
              </Link>
            )}
          </div>
        </section>

        <CategoryNav activeCategory={activeCategory} onCategoryChange={setActiveCategory} uiLanguage={uiLanguage} />

        {user && bookmarkedPhrases.length > 0 && (
          <section className="container mx-auto px-3 sm:px-6 py-2">
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

        <main
          className="container mx-auto px-3 sm:px-6 py-4 sm:py-6"
          aria-label={`${t.categories[activeCategory as keyof typeof t.categories]} phrases`}
        >
          {filteredPhrases.length === 0 ? (
            <div className="text-center py-6 sm:py-8 px-3">
              <p className="text-base sm:text-lg text-muted-foreground">
                {t.noResults || "No phrases found matching your search."}
              </p>
              <p className="mt-1 sm:mt-2 text-sm text-muted-foreground">
                {showBookmarksOnly
                  ? t.noBookmarks || "No bookmarked phrases in this category."
                  : t.tryDifferent || "Try a different search term or browse categories."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 sm:gap-4">
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

        {children && (
          <div className="container mx-auto px-3 sm:px-6 py-4 mb-8">
            {children}
          </div>
        )}

        <footer className="border-t mt-6 sm:mt-10 py-4 sm:py-6 bg-muted/30">
          <div className="container mx-auto px-3 sm:px-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
              <div className="text-center md:text-left">
                <p className="text-xs sm:text-sm text-muted-foreground">{t.footerText}</p>
                <p className="mt-1 sm:mt-2 text-xs italic text-muted-foreground">"I am because we are" - Ubuntu</p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <nav className="flex flex-wrap justify-center gap-4 sm:gap-6 text-xs sm:text-sm">
                  <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">
                    {t.footerAbout}
                  </Link>
                  <Link href="/why" className="text-muted-foreground hover:text-primary transition-colors">
                    {t.footerWhy}
                  </Link>
                  <Link href="/ai-policy" className="text-muted-foreground hover:text-primary transition-colors">
                    AI Policy
                  </Link>
                  <Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">
                    {t.footerTerms}
                  </Link>
                  <Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">
                    {t.footerPrivacy}
                  </Link>
                </nav>
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
