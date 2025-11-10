import { redirect } from "next/navigation"
import { getUser, createClient } from "@/lib/supabase/server"
import { checkIsAdmin } from "@/lib/supabase/admin"
import { AdminLayout } from "@/components/admin/admin-layout"
import { ModerationManagement } from "@/components/admin/moderation-management"
import { isDevMode } from "@/lib/dev-mode"

export const metadata = {
  title: "Content Moderation",
}

// Mock data for dev mode
const DEV_MODERATION_ALERTS = [
  {
    id: 1,
    user_id: "3",
    content_type: "user_content",
    content_id: "123",
    reason: "spam",
    severity: "medium",
    status: "pending",
    created_at: new Date().toISOString(),
    resolved_at: null,
    resolved_by: null,
    notes: "User submitted multiple identical phrases",
    profiles: {
      user_id: "3",
      email: "emma@example.com",
      display_name: "Emma Williams",
    },
  },
  {
    id: 2,
    user_id: "5",
    content_type: "phrase_suggestion",
    content_id: "456",
    reason: "inappropriate",
    severity: "high",
    status: "pending",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    resolved_at: null,
    resolved_by: null,
    notes: "Flagged for review - contains potentially offensive content",
    profiles: {
      user_id: "5",
      email: "olivia@example.com",
      display_name: "Olivia Davis",
    },
  },
  {
    id: 3,
    user_id: "4",
    content_type: "user_content",
    content_id: "789",
    reason: "duplicate",
    severity: "low",
    status: "resolved",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    resolved_at: new Date(Date.now() - 3600000).toISOString(),
    resolved_by: "admin_1",
    notes: "Duplicate entry removed",
    profiles: {
      user_id: "4",
      email: "james@example.com",
      display_name: "James Brown",
    },
  },
]

export default async function AdminModerationPage() {
  const user = await getUser()

  if (!user) redirect("/auth")

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect("/")

  let alertsWithProfiles = DEV_MODERATION_ALERTS

  if (!isDevMode()) {
    try {
      const supabase = await createClient()

      // Fetch moderation alerts
      const { data: moderationAlerts } = await supabase
        .from("moderation_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      // Fetch user profiles for the alerts
      const userIds = [...new Set(moderationAlerts?.map((a) => a.user_id) || [])]
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, display_name")
        .in("user_id", userIds)

      // Merge profiles into alerts
      alertsWithProfiles = moderationAlerts?.map((alert) => ({
        ...alert,
        profiles: profiles?.find((p) => p.user_id === alert.user_id),
      })) || DEV_MODERATION_ALERTS
    } catch (error) {
      console.error("Error fetching moderation alerts:", error)
      // Fall back to dev data
    }
  }

  return (
    <AdminLayout>
      <ModerationManagement moderationAlerts={alertsWithProfiles} />
    </AdminLayout>
  )
}
