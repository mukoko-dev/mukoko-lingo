import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase/server"
import { checkIsAdmin, getUserActivitySummary } from "@/lib/supabase/admin"
import { AdminLayout } from "@/components/admin/admin-layout"
import { UserManagement } from "@/components/admin/user-management"
import { isDevMode } from "@/lib/dev-mode"

export const metadata = {
  title: "User Management",
}

// Mock data for dev mode
const DEV_USERS = [
  {
    user_id: "1",
    email: "sarah@example.com",
    display_name: "Sarah Johnson",
    role: "user",
    total_views: 89,
    total_bookmarks: 23,
    total_progress: 45,
    last_active: new Date().toISOString(),
  },
  {
    user_id: "2",
    email: "michael@example.com",
    display_name: "Michael Chen",
    role: "admin",
    total_views: 156,
    total_bookmarks: 12,
    total_progress: 78,
    last_active: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    user_id: "3",
    email: "emma@example.com",
    display_name: "Emma Williams",
    role: "user",
    total_views: 67,
    total_bookmarks: 34,
    total_progress: 32,
    last_active: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    user_id: "4",
    email: "james@example.com",
    display_name: "James Brown",
    role: "user",
    total_views: 112,
    total_bookmarks: 28,
    total_progress: 56,
    last_active: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    user_id: "5",
    email: "olivia@example.com",
    display_name: "Olivia Davis",
    role: "user",
    total_views: 43,
    total_bookmarks: 15,
    total_progress: 21,
    last_active: new Date(Date.now() - 432000000).toISOString(),
  },
  {
    user_id: "6",
    email: "william@example.com",
    display_name: "William Martinez",
    role: "user",
    total_views: 78,
    total_bookmarks: 19,
    total_progress: 38,
    last_active: new Date(Date.now() - 604800000).toISOString(),
  },
]

export default async function AdminUsersPage() {
  const user = await getUser()

  if (!user) redirect("/auth")

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect("/")

  let userActivity = DEV_USERS

  if (!isDevMode()) {
    try {
      userActivity = await getUserActivitySummary()
    } catch (error) {
      console.error("Error fetching user activity:", error)
      // Fall back to dev data
    }
  }

  return (
    <AdminLayout>
      <UserManagement userActivity={userActivity} />
    </AdminLayout>
  )
}
