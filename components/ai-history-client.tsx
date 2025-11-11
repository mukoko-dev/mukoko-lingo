"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useUILanguage } from "@/lib/hooks/use-ui-language"
import { MessageCircle, BookOpen, Globe, ExternalLink, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Conversation {
  id: string
  type: "practice" | "scenario" | "translation_help"
  language: string
  title: string
  created_at: string
  updated_at: string
}

interface AIHistoryClientProps {
  conversations: Conversation[]
}

export function AIHistoryClient({ conversations: initialConversations }: AIHistoryClientProps) {
  const { uiLanguage } = useUILanguage()
  const router = useRouter()
  const [conversations, setConversations] = useState(initialConversations)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "practice":
        return <MessageCircle className="h-4 w-4" />
      case "scenario":
        return <BookOpen className="h-4 w-4" />
      case "translation_help":
        return <Globe className="h-4 w-4" />
      default:
        return <MessageCircle className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "practice":
        return "Practice"
      case "scenario":
        return "Scenario"
      case "translation_help":
        return "Translation Help"
      default:
        return type
    }
  }

  const handleDelete = async (conversationId: string) => {
    if (!confirm("Are you sure you want to delete this conversation? This action cannot be undone.")) {
      return
    }

    setDeletingId(conversationId)
    const supabase = createClient()

    try {
      // Delete all messages first (due to foreign key constraint)
      await supabase.from("ai_messages").delete().eq("conversation_id", conversationId)

      // Then delete the conversation
      const { error } = await supabase.from("ai_conversations").delete().eq("id", conversationId)

      if (error) throw error

      // Remove from local state
      setConversations((prev) => prev.filter((c) => c.id !== conversationId))
    } catch (error) {
      console.error("Failed to delete conversation:", error)
      alert("Failed to delete conversation. Please try again.")
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewConversation = (conversationId: string) => {
    // Navigate to AI practice with the conversation ID
    router.push(`/app/ai-practice?conversation=${conversationId}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="mb-6">
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
              AI Chat History
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              View and manage your conversation history with AI tutors
            </p>
          </div>

          {conversations.length === 0 ? (
            <Card className="p-12 text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-xl font-semibold mb-2">No Conversations Yet</h2>
              <p className="text-muted-foreground mb-4">
                Start chatting with AI tutors to see your conversation history here
              </p>
              <Button onClick={() => router.push("/app/ai-practice")}>Start a Conversation</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {conversations.map((conversation) => (
                <Card key={conversation.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getTypeIcon(conversation.type)}
                        <h3 className="font-medium truncate">{conversation.title}</h3>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary" className="text-xs">
                          {getTypeLabel(conversation.type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {conversation.language}
                        </Badge>
                        <span className="text-xs">
                          Updated {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewConversation(conversation.id)}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(conversation.id)}
                        disabled={deletingId === conversation.id}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
