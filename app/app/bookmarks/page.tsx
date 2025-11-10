import { getUser, createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BookmarksClient } from "@/components/bookmarks-client"
import type { Phrase } from "@/lib/phrases-data"

export const metadata = {
  title: "My Bookmarks - Nyuchi Lingo",
  description: "View all your bookmarked phrases in one place",
}

async function getBookmarkedPhrases(): Promise<Phrase[]> {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("bookmarks")
    .select(
      `
      phrase_id,
      phrases (
        id,
        category,
        english,
        shona,
        ndebele,
        chinese,
        english_pronunciation,
        shona_pronunciation,
        ndebele_pronunciation,
        chinese_pronunciation,
        english_context,
        shona_context,
        ndebele_context,
        chinese_context
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching bookmarked phrases:", error)
    return []
  }

  return (data || [])
    .filter((row) => row.phrases)
    .map((row) => {
      const phrase = Array.isArray(row.phrases) ? row.phrases[0] : row.phrases
      return {
        id: phrase.id,
        category: phrase.category,
        english: phrase.english,
        shona: phrase.shona,
        ndebele: phrase.ndebele,
        chinese: phrase.chinese,
        pronunciation: {
          english: phrase.english_pronunciation,
          shona: phrase.shona_pronunciation,
          ndebele: phrase.ndebele_pronunciation,
          chinese: phrase.chinese_pronunciation,
        },
        context: {
          en: phrase.english_context,
          sn: phrase.shona_context,
          nd: phrase.ndebele_context,
          zh: phrase.chinese_context,
        },
      }
    })
}

export default async function BookmarksPage() {
  const phrases = await getBookmarkedPhrases()

  return <BookmarksClient phrases={phrases} />
}
