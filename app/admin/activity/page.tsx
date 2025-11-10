import { redirect } from "next/navigation"
import { getUser, createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/supabase/admin"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ActivityLog } from "@/components/admin/activity-log"
import { isDevMode } from "@/lib/dev-mode"

export const metadata = {
  title: "Activity Log",
}

// Mock data for dev mode
const DEV_RECENT_VIEWS = [
  {
    id: 1,
    user_id: "1",
    phrase_id: 1,
    viewed_at: new Date().toISOString(),
    phrases: {
      english: "Hello",
      shona: "Mhoro",
      ndebele: "Sawubona",
      chinese: "你好",
    },
    profiles: {
      user_id: "1",
      email: "sarah@example.com",
      display_name: "Sarah Johnson",
    },
  },
  {
    id: 2,
    user_id: "2",
    phrase_id: 2,
    viewed_at: new Date(Date.now() - 300000).toISOString(),
    phrases: {
      english: "Good morning",
      shona: "Mangwanani",
      ndebele: "Livukile",
      chinese: "早上好",
    },
    profiles: {
      user_id: "2",
      email: "michael@example.com",
      display_name: "Michael Chen",
    },
  },
  {
    id: 3,
    user_id: "3",
    phrase_id: 3,
    viewed_at: new Date(Date.now() - 600000).toISOString(),
    phrases: {
      english: "Thank you",
      shona: "Ndatenda",
      ndebele: "Ngiyabonga",
      chinese: "谢谢",
    },
    profiles: {
      user_id: "3",
      email: "emma@example.com",
      display_name: "Emma Williams",
    },
  },
  {
    id: 4,
    user_id: "1",
    phrase_id: 4,
    viewed_at: new Date(Date.now() - 900000).toISOString(),
    phrases: {
      english: "How are you?",
      shona: "Wakadini?",
      ndebele: "Unjani?",
      chinese: "你好吗？",
    },
    profiles: {
      user_id: "1",
      email: "sarah@example.com",
      display_name: "Sarah Johnson",
    },
  },
  {
    id: 5,
    user_id: "4",
    phrase_id: 5,
    viewed_at: new Date(Date.now() - 1200000).toISOString(),
    phrases: {
      english: "Goodbye",
      shona: "Chisarai",
      ndebele: "Sala kahle",
      chinese: "再见",
    },
    profiles: {
      user_id: "4",
      email: "james@example.com",
      display_name: "James Brown",
    },
  },
]

export default async function AdminActivityPage() {
  const user = await getUser()

  if (!user) redirect("/auth")

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect("/")

  let viewsWithProfiles = DEV_RECENT_VIEWS

  if (!isDevMode()) {
    try {
      const supabase = await createClient()

      // Fetch recent views with phrase and user info
      const { data: recentViews } = await supabase
        .from("phrase_views")
        .select("*, phrases(english, shona, ndebele, chinese)")
        .order("viewed_at", { ascending: false })
        .limit(20)

      // Fetch user profiles
      const userIds = [...new Set(recentViews?.map((v) => v.user_id) || [])]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds)

      // Merge profiles into views
      viewsWithProfiles = recentViews?.map((view) => ({
        ...view,
        profiles: profiles?.find((p) => p.user_id === view.user_id),
      })) || DEV_RECENT_VIEWS
    } catch (error) {
      console.error("Error fetching activity log:", error)
      // Fall back to dev data
    }
  }

  return (
    <AdminLayout>
      <ActivityLog recentViews={viewsWithProfiles} />
    </AdminLayout>
  )
}
