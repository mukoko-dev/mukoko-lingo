import { getUser, createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AnalyticsClient } from "@/components/analytics-client"

export const metadata = {
  title: "Learning Analytics - Nyuchi Lingo",
  description: "View your learning analytics and insights",
}

async function getAnalytics() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  // Get user's most viewed phrases
  const { data: recentViews } = await supabase
    .from("phrase_views")
    .select(
      `
      phrase_id,
      phrases (
        english,
        shona,
        ndebele,
        chinese,
        category
      )
    `,
    )
    .eq("user_id", user.id)
    .order("viewed_at", { ascending: false })
    .limit(50)

  // Get study sessions for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: studySessions } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", user.id)
    .gte("session_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("session_date", { ascending: true })

  // Calculate category distribution from progress
  const { data: progress } = await supabase
    .from("phrase_progress")
    .select(
      `
      status,
      phrases (
        category
      )
    `,
    )
    .eq("user_id", user.id)

  // Process data
  const phraseCounts: Record<string, number> = {}
  const categoryStats: Record<string, { learning: number; practiced: number; mastered: number }> = {}

  recentViews?.forEach((view: any) => {
    if (view.phrases) {
      const phrase = Array.isArray(view.phrases) ? view.phrases[0] : view.phrases
      const key = `${phrase.english}-${phrase.category}`
      phraseCounts[key] = (phraseCounts[key] || 0) + 1
    }
  })

  progress?.forEach((item: any) => {
    if (item.phrases) {
      const phrase = Array.isArray(item.phrases) ? item.phrases[0] : item.phrases
      const category = phrase.category
      if (!categoryStats[category]) {
        categoryStats[category] = { learning: 0, practiced: 0, mastered: 0 }
      }
      categoryStats[category][item.status as keyof (typeof categoryStats)[string]]++
    }
  })

  const topPhrases = Object.entries(phraseCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([key]) => {
      const view = recentViews?.find((v: any) => {
        const p = Array.isArray(v.phrases) ? v.phrases[0] : v.phrases
        return p && `${p.english}-${p.category}` === key
      })
      const phrase = view ? (Array.isArray(view.phrases) ? view.phrases[0] : view.phrases) : null
      return phrase
    })
    .filter(Boolean)

  return {
    topPhrases,
    studySessions: studySessions || [],
    categoryStats,
  }
}

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  return <AnalyticsClient analytics={analytics} />
}
