import { getUser, createClient } from "@/lib/supabase/server"
import { LearnClient } from "@/components/learn-client"
import type { Phrase } from "@/lib/phrases-data"
import type { Metadata } from "next"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Learn | Nyuchi Lingo",
  description: "Your personalized learning feed - phrases tailored to your goals and progress",
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

async function getUserLikes(): Promise<string[]> {
  const user = await getUser()

  if (!user) {
    return []
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("phrase_likes").select("phrase_id").eq("user_id", user.id)

  if (error) {
    console.error("[v0] Error fetching likes:", error)
    return []
  }

  return (data || []).map((row) => row.phrase_id)
}

async function getCurrentUser() {
  return await getUser()
}

export default async function LearnPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login?redirect=/app/learn")
  }

  const [phrases, bookmarks, progressMap, likes] = await Promise.all([
    getPhrases(),
    getUserBookmarks(),
    getUserProgress(),
    getUserLikes(),
  ])

  return <LearnClient initialPhrases={phrases} initialBookmarks={bookmarks} initialProgressMap={progressMap} initialLikes={likes} user={user} />
}
