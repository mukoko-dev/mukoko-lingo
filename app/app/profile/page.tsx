import { getUser, createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileClient } from "@/components/profile-client"

export const metadata = {
  title: "Profile - Nyuchi Lingo",
  description: "Manage your Nyuchi Lingo profile and preferences",
}

export default async function ProfilePage() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  // Fetch user analytics data
  const { data: progressStats } = await supabase.from("phrase_progress").select("status").eq("user_id", user.id)

  const { data: bookmarksCount } = await supabase
    .from("bookmarks")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)

  const { data: viewsCount } = await supabase
    .from("phrase_views")
    .select("id", { count: "exact" })
    .eq("user_id", user.id)

  // Get activity over last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: recentViews } = await supabase
    .from("phrase_views")
    .select("viewed_at")
    .eq("user_id", user.id)
    .gte("viewed_at", thirtyDaysAgo.toISOString())
    .order("viewed_at", { ascending: true })

  // Calculate statistics
  const learningCount = progressStats?.filter((p) => p.status === "learning").length || 0
  const practicedCount = progressStats?.filter((p) => p.status === "practiced").length || 0
  const masteredCount = progressStats?.filter((p) => p.status === "mastered").length || 0
  const totalProgress = progressStats?.length || 0

  const analytics = {
    totalProgress,
    learningCount,
    practicedCount,
    masteredCount,
    bookmarksCount: bookmarksCount?.length || 0,
    viewsCount: viewsCount?.length || 0,
    recentViews: recentViews || [],
  }

  return <ProfileClient user={user} profile={profile} analytics={analytics} />
}
