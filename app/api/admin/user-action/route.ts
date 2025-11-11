import { createServerClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"
import { isAdmin } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admin = await isAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const { userId, action, reason } = await request.json()

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["ban", "deactivate", "delete", "activate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Handle delete action separately
    if (action === "delete") {
      // First, log the deletion
      await supabase.from("moderation_alerts").insert({
        user_id: userId,
        content_type: "user_account",
        content_text: `User account deleted by admin. Reason: ${reason || "None provided"}`,
        flagged_reason: "Admin action: Account deletion",
        status: "reviewed",
        admin_notes: reason || "Deleted by admin",
        admin_id: user.id,
      })

      // Delete user (CASCADE will handle related records)
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId)

      if (deleteError) {
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: "User deleted successfully" })
    }

    // Handle ban, deactivate, activate actions
    const statusMap: Record<string, string> = {
      ban: "banned",
      deactivate: "deactivated",
      activate: "active",
    }

    const { error } = await supabase.from("profiles").update({ status: statusMap[action] }).eq("user_id", userId)

    if (error) {
      return NextResponse.json({ error: "Failed to update user status" }, { status: 500 })
    }

    // Log the action in moderation alerts
    await supabase.from("moderation_alerts").insert({
      user_id: userId,
      content_type: "user_account",
      content_text: `User account ${action}ed by admin. Reason: ${reason || "None provided"}`,
      flagged_reason: `Admin action: ${action}`,
      status: "reviewed",
      admin_notes: reason || `User ${action}ed by admin`,
      admin_id: user.id,
    })

    return NextResponse.json({ success: true, message: `User ${action}ed successfully` })
  } catch (error) {
    console.error("Error updating user status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
