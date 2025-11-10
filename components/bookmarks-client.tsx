"use client"

import { useState } from "react"
import { PhraseComparison } from "@/components/phrase-comparison"
import { Bookmark } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Phrase } from "@/lib/phrases-data"
import { translations } from "@/lib/translations"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useUILanguage } from "@/lib/hooks/use-ui-language"

interface BookmarksClientProps {
  phrases: Phrase[]
}

export function BookmarksClient({ phrases: initialPhrases }: BookmarksClientProps) {
  const { uiLanguage } = useUILanguage()
  const [phrases, setPhrases] = useState(initialPhrases)
  const router = useRouter()
  const supabase = createClient()
  const t = translations[uiLanguage]

  const handleRemoveBookmark = async (phraseId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("phrase_id", phraseId)

    if (!error) {
      setPhrases((prev) => prev.filter((p) => p.id !== phraseId))
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <main className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{t.myBookmarks || "My Bookmarks"}</h1>
            <p className="text-muted-foreground">
              {phrases.length} {t.savedPhrases || "saved phrases"}
            </p>
          </div>
        </div>

        {phrases.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">{t.noBookmarksYet || "No bookmarks yet"}</h2>
            <p className="text-muted-foreground mb-6">
              {t.startBookmarking || "Start bookmarking phrases to save them for later"}
            </p>
            <Button asChild>
              <Link href="/">{t.explorePhrases || "Explore Phrases"}</Link>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {phrases.map((phrase) => (
              <PhraseComparison
                key={phrase.id}
                phrase={phrase}
                isBookmarked={true}
                onToggleBookmark={() => handleRemoveBookmark(phrase.id)}
                uiLanguage={uiLanguage}
              />
            ))}
          </div>
        )}
        </main>
      </SidebarLayout>
    </div>
  )
}
