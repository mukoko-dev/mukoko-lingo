import { redirect } from "next/navigation"
import { isAdmin } from "@/lib/supabase/admin"

export default async function AdminPage() {
  // Verify admin access before redirecting
  const admin = await isAdmin()

  if (!admin) {
    redirect("/app")
  }

  // Redirect /admin to /admin/overview
  // All admin functionality is now in separate route pages:
  // - /admin/overview - Dashboard statistics
  // - /admin/users - User management
  // - /admin/phrases - Phrase management
  // - /admin/standards - Learning standards
  // - /admin/moderation - Content moderation
  // - /admin/activity - Recent activity
  redirect("/admin/overview")
}
