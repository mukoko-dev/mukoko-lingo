import { getUser, createClient } from "@/lib/supabase/server"
import { ClientPage } from "@/components/client-page"
import { AIRecommendations } from "@/components/ai-recommendations"
import { createCourseSchema } from "@/lib/seo-config"
import type { Phrase } from "@/lib/phrases-data"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Home",
  description:
    "Essential travel phrases for tourists visiting Zimbabwe and Southern Africa. Learn greetings, directions, shopping, and emergency phrases in Shona, Ndebele, and Chinese. AI-powered language learning with 200+ phrases.",
  keywords: [
    "Zimbabwe travel guide",
    "Victoria Falls phrases",
    "Shona for tourists",
    "Ndebele travel phrases",
    "Zimbabwe language app",
    "Southern Africa travel",
    "tourist survival guide Zimbabwe",
    "learn Shona fast",
    "travel to Harare",
    "Bulawayo language guide",
  ],
  openGraph: {
    title: "Nyuchi Lingo - Essential Travel Phrases for Zimbabwe Tourists",
    description:
      "Master local languages before your Zimbabwe trip! Learn essential Shona, Ndebele & Chinese phrases with AI tutoring. Perfect for Victoria Falls, Harare, and beyond.",
  },
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

async function getCurrentUser() {
  return await getUser()
}

export default async function Page() {
  const user = await getCurrentUser()

  // Redirect authenticated users to learn page
  if (user) {
    return (
      <script dangerouslySetInnerHTML={{
        __html: `window.location.href = '/app/learn'`
      }} />
    )
  }

  const [phrases, bookmarks] = await Promise.all([getPhrases(), getUserBookmarks()])

  const courseSchema = createCourseSchema("Travel & Tourism", phrases.length)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />

      <ClientPage initialPhrases={phrases} initialBookmarks={bookmarks}>
        <AIRecommendations />
      </ClientPage>
    </>
  )
}
