import { redirect } from "next/navigation"

export default async function AdminPage() {
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
