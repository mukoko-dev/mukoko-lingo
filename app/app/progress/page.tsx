import { getUser, createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProgressClient } from "@/components/progress-client"

export const metadata = {
  title: "My Progress - Nyuchi Lingo",
  description: "Track your language learning progress",
}

async function getUserProgress() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", user.id).single()

  const { data: progress } = await supabase
    .from("phrase_progress")
    .select("status, times_practiced")
    .eq("user_id", user.id)

  const stats = {
    learning: progress?.filter((p) => p.status === "learning").length || 0,
    practiced: progress?.filter((p) => p.status === "practiced").length || 0,
    mastered: progress?.filter((p) => p.status === "mastered").length || 0,
    totalPracticed: progress?.reduce((sum, p) => sum + p.times_practiced, 0) || 0,
  }

  return { profile, stats }
}

export default async function ProgressPage() {
  const { profile, stats } = await getUserProgress()

  return <ProgressClient profile={profile} stats={stats} />
}
