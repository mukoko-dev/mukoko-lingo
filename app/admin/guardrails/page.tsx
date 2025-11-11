import { createClient, getUser } from "@/lib/supabase/server"
import { isAdmin } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { GuardrailsClient } from "@/components/admin/guardrails-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Guardrails Management | Admin | Nyuchi Lingo",
  description: "Configure content moderation rules and guardrails",
}

async function getGuardrails() {
  const supabase = await createClient()

  const [{ data: coreGuardrails }, { data: customGuardrails }, { data: auditLog }] = await Promise.all([
    supabase.from("guardrails").select("*").order("severity", { ascending: false }),
    supabase.from("custom_guardrails").select("*").order("created_at", { ascending: false }),
    supabase
      .from("guardrails_audit_log")
      .select(`
        *,
        changed_by_user:changed_by(
          id,
          email
        )
      `)
      .order("created_at", { ascending: false })
      .limit(50),
  ])

  return {
    coreGuardrails: coreGuardrails || [],
    customGuardrails: customGuardrails || [],
    auditLog: auditLog || [],
  }
}

export default async function GuardrailsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/auth/login?redirect=/admin/guardrails")
  }

  const hasAdminAccess = await isAdmin()
  if (!hasAdminAccess) {
    redirect("/app/learn")
  }

  const data = await getGuardrails()

  return <GuardrailsClient {...data} />
}
