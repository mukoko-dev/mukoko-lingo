import { createClient, getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardClient } from "@/components/dashboard-client"

export const metadata = {
  title: "Dashboard | Nyuchi Lingo",
  description: "Your personal language learning dashboard",
}

async function getDashboardData() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login?redirect=/app/dashboard")
  }

  const supabase = await createClient()

  // Fetch user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  // Fetch progress stats
  const { data: progress } = await supabase
    .from("phrase_progress")
    .select("status, times_practiced, updated_at")
    .eq("user_id", user.id)

  const stats = {
    learning: progress?.filter((p) => p.status === "learning").length || 0,
    practiced: progress?.filter((p) => p.status === "practiced").length || 0,
    mastered: progress?.filter((p) => p.status === "mastered").length || 0,
    totalPhrases: (progress?.length || 0),
    totalPracticed: progress?.reduce((sum, p) => sum + p.times_practiced, 0) || 0,
  }

  // Fetch today's study session
  const today = new Date().toISOString().split("T")[0]
  const { data: todaySession } = await supabase
    .from("study_sessions")
    .select("phrases_studied, time_spent_minutes")
    .eq("user_id", user.id)
    .eq("session_date", today)
    .single()

  // Fetch recent study sessions for streak calculation
  const { data: recentSessions } = await supabase
    .from("study_sessions")
    .select("session_date")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })
    .limit(30)

  // Calculate streak
  let streak = 0
  if (recentSessions && recentSessions.length > 0) {
    const dates = recentSessions.map(s => new Date(s.session_date))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let currentDate = new Date(today)
    for (const sessionDate of dates) {
      sessionDate.setHours(0, 0, 0, 0)
      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }
  }

  // Fetch AI conversation count
  const { count: conversationCount } = await supabase
    .from("ai_conversations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Fetch bookmarks count
  const { count: bookmarksCount } = await supabase
    .from("bookmarks")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)

  // Get AI recommendations
  const { data: recommendations } = await supabase
    .from("phrases")
    .select("id, category, english, shona, ndebele")
    .limit(5)
    .order("created_at", { ascending: false })

  return {
    profile,
    stats,
    todaySession: todaySession || { phrases_studied: 0, time_spent_minutes: 0 },
    streak,
    conversationCount: conversationCount || 0,
    bookmarksCount: bookmarksCount || 0,
    recommendations: recommendations || [],
  }
}

export default async function DashboardPage() {
  const dashboardData = await getDashboardData()

  return <DashboardClient {...dashboardData} />
}
