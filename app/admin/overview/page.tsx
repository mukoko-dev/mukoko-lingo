import { redirect } from "next/navigation"
import { getUser } from "@/lib/supabase/server"
import { checkIsAdmin, getAdminStats, getUserActivitySummary } from "@/lib/supabase/admin"
import { AdminLayout } from "@/components/admin/admin-layout"
import { AdminDashboardOverview } from "@/components/admin/admin-dashboard-overview"
import { isDevMode } from "@/lib/dev-mode"

export const metadata = {
  title: "Admin Dashboard",
}

// Mock data for dev mode
const DEV_STATS = {
  total_users: 42,
  total_admins: 3,
  total_phrases: 247,
  total_progress_records: 856,
  total_bookmarks: 324,
  total_views: 1543,
}

const DEV_ACTIVITY = [
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
]

export default async function AdminOverviewPage() {
  const user = await getUser()

  if (!user) redirect("/auth")

  const isAdmin = await checkIsAdmin()
  if (!isAdmin) redirect("/")

  // Use mock data in dev mode, real data in production
  let stats = DEV_STATS
  let recentActivity = DEV_ACTIVITY

  if (!isDevMode()) {
    try {
      stats = await getAdminStats()
      recentActivity = await getUserActivitySummary()
    } catch (error) {
      console.error("Error fetching admin data:", error)
      // Fall back to dev data if there's an error
    }
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">Real-time insights and platform analytics</p>
      </div>

      <AdminDashboardOverview stats={stats} recentActivity={recentActivity} />
    </AdminLayout>
  )
}
