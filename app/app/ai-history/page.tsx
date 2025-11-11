import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AIHistoryClient } from "@/components/ai-history-client"

export const metadata = {
  title: "AI Chat History | Nyuchi Lingo",
  description: "View your conversation history with AI tutors",
}

export default async function AIHistoryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/app/ai-history")
  }

  // Fetch user's AI conversations
  const { data: conversations } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50)

  return <AIHistoryClient conversations={conversations || []} />
}
