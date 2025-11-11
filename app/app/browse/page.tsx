import { getUser, createClient } from "@/lib/supabase/server"
import { BrowseClient } from "@/components/browse-client"
import type { Phrase } from "@/lib/phrases-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Browse Phrases | Nyuchi Lingo",
  description: "Browse and learn phrases in Shona, Ndebele, English, and Chinese",
}

async function getPhrases(): Promise<Phrase[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from("phrases").select("*").order("category", { ascending: true })

  if (error) {
    console.error("[v0] Error fetching phrases:", error)
    return []
  }

  return (data || []).map((row) => ({
    id: row.id,
    category: row.category,
    english: row.english,
    shona: row.shona,
    ndebele: row.ndebele,
    chinese: row.chinese,
    pronunciation: {
      english: row.english_pronunciation,
      shona: row.shona_pronunciation,
      ndebele: row.ndebele_pronunciation,
      chinese: row.chinese_pronunciation,
    },
    context: {
      en: row.english_context,
      sn: row.shona_context,
      nd: row.ndebele_context,
      zh: row.chinese_context,
    },
  }))
}

async function getUserBookmarks(): Promise<string[]> {
  const user = await getUser()

  if (!user) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("bookmarks").select("phrase_id").eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error fetching bookmarks:", error)
    return []
  }

  return (data || []).map((row) => row.phrase_id)
}

async function getUserProgress(): Promise<Record<string, "learning" | "practiced" | "mastered">> {
  const user = await getUser()

  if (!user) {
    return {}
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("phrase_progress").select("phrase_id, status").eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error fetching progress:", error)
    return {}
  }

  const map: Record<string, "learning" | "practiced" | "mastered"> = {}
  data?.forEach((row) => {
    map[row.phrase_id] = row.status as "learning" | "practiced" | "mastered"
  })
  return map
}

async function getCurrentUser() {
  return await getUser()
}

export default async function BrowsePage() {
  const [phrases, bookmarks, progressMap, user] = await Promise.all([
    getPhrases(),
    getUserBookmarks(),
    getUserProgress(),
    getCurrentUser(),
  ])

  return <BrowseClient initialPhrases={phrases} initialBookmarks={bookmarks} initialProgressMap={progressMap} user={user} />
}
