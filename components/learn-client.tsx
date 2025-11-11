"use client"

import { useState, useMemo, useEffect } from "react"
import { PhraseComparison } from "@/components/phrase-comparison"
import { SearchBar } from "@/components/search-bar"
import { Bookmark, Heart, TrendingUp, Sparkles, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Phrase } from "@/lib/phrases-data"
import { translations, type UILanguage } from "@/lib/translations"
import { createClient } from "@/lib/supabase/client"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useUILanguage } from "@/lib/hooks/use-ui-language"
import { cn } from "@/lib/utils"

interface LearnClientProps {
  initialPhrases: Phrase[]
  initialBookmarks: string[]
  initialLikes: string[]
  initialProgressMap: Record<string, "learning" | "practiced" | "mastered">
  user: any
}

type FeedFilter = "personalized" | "trending" | "popular" | "new"

export function LearnClient({ initialPhrases, initialBookmarks, initialLikes, initialProgressMap, user }: LearnClientProps) {
  const { uiLanguage } = useUILanguage()
  const [bookmarkedPhrases, setBookmarkedPhrases] = useState<string[]>(initialBookmarks)
  const [likedPhrases, setLikedPhrases] = useState<string[]>(initialLikes)
  const [searchQuery, setSearchQuery] = useState("")
  const [progressMap, setProgressMap] = useState<Record<string, "learning" | "practiced" | "mastered">>(initialProgressMap)
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("personalized")
  const [isLoadingFeed, setIsLoadingFeed] = useState(false)
  const [feedPhrases, setFeedPhrases] = useState<Phrase[]>(initialPhrases)
  const supabase = createClient()

  const t = translations[uiLanguage]

  // Load personalized feed on mount and filter change
  useEffect(() => {
    loadFeed()
  }, [feedFilter])

  const loadFeed = async () => {
    setIsLoadingFeed(true)
    try {
      const response = await fetch(`/api/feed?filter=${feedFilter}&limit=50`)
      const data = await response.json()

      if (data.phrases) {
        // Map API response to Phrase format
        const mappedPhrases = data.phrases.map((p: any) => ({
          id: p.id,
          category: p.category,
          english: p.english,
          shona: p.shona,
          ndebele: p.ndebele,
          chinese: p.chinese,
          pronunciation: {
            english: p.english_pronunciation,
            shona: p.shona_pronunciation,
            ndebele: p.ndebele_pronunciation,
            chinese: p.chinese_pronunciation,
          },
          context: {
            en: p.english_context,
            sn: p.shona_context,
            nd: p.ndebele_context,
            zh: p.chinese_context,
          },
          // Include engagement data
          _engagement: p.engagement,
          _recommendationReasons: p.recommendation_reasons || [],
        }))

        setFeedPhrases(mappedPhrases)
      }
    } catch (error) {
      console.error("Failed to load feed:", error)
      // Fallback to initial phrases
      setFeedPhrases(initialPhrases)
    } finally {
      setIsLoadingFeed(false)
    }
  }

  const loadBookmarks = async () => {
    const { data } = await supabase.from("bookmarks").select("phrase_id").eq("user_id", user.id)

    if (data) {
      setBookmarkedPhrases(data.map((row) => row.phrase_id))
    }
  }

  const loadLikes = async () => {
    const { data } = await supabase.from("phrase_likes").select("phrase_id").eq("user_id", user.id)

    if (data) {
      setLikedPhrases(data.map((row) => row.phrase_id))
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

  // Search and filter logic
  const filteredPhrases = useMemo(() => {
    let phrases = feedPhrases

    if (!searchQuery.trim()) {
      return phrases
    }

    const query = searchQuery.toLowerCase()
    return phrases.filter((phrase) => {
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
  }, [feedPhrases, searchQuery])

  // Popular phrases (most liked)
  const popularPhrases = useMemo(() => {
    return feedPhrases
      .filter((p: any) => p._engagement?.like_count > 0)
      .sort((a: any, b: any) => (b._engagement?.like_count || 0) - (a._engagement?.like_count || 0))
      .slice(0, 10)
  }, [feedPhrases])

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

  const toggleLike = async (phraseId: string) => {
    if (!user) return

    const isCurrentlyLiked = likedPhrases.includes(phraseId)

    // Optimistic update
    if (isCurrentlyLiked) {
      setLikedPhrases((prev) => prev.filter((id) => id !== phraseId))
      await supabase.from("phrase_likes").delete().eq("user_id", user.id).eq("phrase_id", phraseId)
    } else {
      setLikedPhrases((prev) => [...prev, phraseId])
      await supabase.from("phrase_likes").insert({ user_id: user.id, phrase_id: phraseId })
    }

    // Reload feed to reflect updated engagement
    setTimeout(() => loadFeed(), 500)
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

    // Reload feed after progress update (recommendations may change)
    setTimeout(() => loadFeed(), 500)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-6">
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Learn
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Your personalized learning feed - phrases tailored to your goals and progress
            </p>
          </div>

          {/* Search */}
          <section className="mb-4">
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} uiLanguage={uiLanguage} />
          </section>

          {/* Feed Filter Tabs */}
          <section className="mb-6">
            <Tabs value={feedFilter} onValueChange={(value) => setFeedFilter(value as FeedFilter)} className="w-full">
              <TabsList className="grid w-full grid-cols-4 gap-2">
                <TabsTrigger value="personalized" className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">For You</span>
                  <span className="sm:hidden">You</span>
                </TabsTrigger>
                <TabsTrigger value="trending" className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4" />
                  <span>Trending</span>
                </TabsTrigger>
                <TabsTrigger value="popular" className="flex items-center gap-1.5">
                  <Heart className="h-4 w-4" />
                  <span>Popular</span>
                </TabsTrigger>
                <TabsTrigger value="new" className="flex items-center gap-1.5">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">Beginner</span>
                  <span className="sm:hidden">New</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </section>

          {/* Bookmarks/Likes Quick Stats */}
          {user && (bookmarkedPhrases.length > 0 || likedPhrases.length > 0) && (
            <section className="flex gap-2 mb-4">
              {bookmarkedPhrases.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Bookmark className="h-3.5 w-3.5" />
                  <span>{bookmarkedPhrases.length} saved</span>
                </Badge>
              )}
              {likedPhrases.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5" />
                  <span>{likedPhrases.length} liked</span>
                </Badge>
              )}
            </section>
          )}

          {/* Main Feed */}
          <main className="py-4">
            {isLoadingFeed ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading your personalized feed...</p>
              </div>
            ) : filteredPhrases.length === 0 ? (
              <div className="text-center py-8 px-3">
                <p className="text-lg text-muted-foreground">{t.noResults || "No phrases found matching your search."}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.tryDifferent || "Try a different search term or change your feed filter."}
                </p>
              </div>
            ) : (
              <>
                {/* Feed description based on filter */}
                <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {feedFilter === "personalized" && "Phrases selected based on your learning goals, progress, and interests"}
                    {feedFilter === "trending" && "Phrases that are currently popular with learners"}
                    {feedFilter === "popular" && "Most liked phrases by the community"}
                    {feedFilter === "new" && "Essential phrases perfect for beginners"}
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {filteredPhrases.map((phrase: any) => (
                    <div key={phrase.id} className="relative">
                      {/* Show recommendation reasons for personalized feed */}
                      {feedFilter === "personalized" && phrase._recommendationReasons && phrase._recommendationReasons.length > 0 && (
                        <div className="mb-2 flex gap-1.5 flex-wrap">
                          {phrase._recommendationReasons.slice(0, 3).map((reason: string, idx: number) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {reason.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      )}

                      <PhraseComparison
                        phrase={phrase}
                        isBookmarked={bookmarkedPhrases.includes(phrase.id)}
                        isLiked={likedPhrases.includes(phrase.id)}
                        onToggleBookmark={() => toggleBookmark(phrase.id)}
                        onToggleLike={() => toggleLike(phrase.id)}
                        uiLanguage={uiLanguage}
                        progressStatus={user ? progressMap[phrase.id] || null : null}
                        onProgressUpdate={user ? (status) => handleProgressUpdate(phrase.id, status) : undefined}
                        likeCount={phrase._engagement?.like_count || 0}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </main>

          {/* Popular Phrases Section */}
          {popularPhrases.length > 0 && feedFilter !== "popular" && !searchQuery && (
            <section className="mt-8 pt-8 border-t">
              <div className="mb-4">
                <h2 className="font-serif text-xl sm:text-2xl font-bold flex items-center gap-2">
                  <Heart className="h-5 w-5 text-rose-500" />
                  Most Loved Phrases
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Community favorites - see what other learners love
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {popularPhrases.slice(0, 6).map((phrase: any) => (
                  <div key={phrase.id} className="relative">
                    <Badge className="absolute -top-2 -right-2 z-10 bg-rose-500 hover:bg-rose-600">
                      {phrase._engagement?.like_count} ❤️
                    </Badge>
                    <PhraseComparison
                      phrase={phrase}
                      isBookmarked={bookmarkedPhrases.includes(phrase.id)}
                      isLiked={likedPhrases.includes(phrase.id)}
                      onToggleBookmark={() => toggleBookmark(phrase.id)}
                      onToggleLike={() => toggleLike(phrase.id)}
                      uiLanguage={uiLanguage}
                      progressStatus={user ? progressMap[phrase.id] || null : null}
                      onProgressUpdate={user ? (status) => handleProgressUpdate(phrase.id, status) : undefined}
                      likeCount={phrase._engagement?.like_count || 0}
                      compact
                    />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
