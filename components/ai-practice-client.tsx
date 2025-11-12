"use client"

import type React from "react"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, BookOpen, Globe, Send, Loader2 } from "lucide-react"
import { translations } from "@/lib/translations"
import { ScenarioGenerator } from "./scenario-generator"
import { TranslationHelper } from "./translation-helper"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { useUILanguage } from "@/lib/hooks/use-ui-language"

export function AIPracticeClient() {
  const { uiLanguage } = useUILanguage()
  const [practiceLanguage, setPracticeLanguage] = useState("english")
  const [conversationType, setConversationType] = useState<"practice" | "scenario" | "translation_help">("practice")
  const [conversationId, setConversationId] = useState<string>()
  const [scenario, setScenario] = useState<any>(null)

  const { messages, append, isLoading, input, handleInputChange, handleSubmit } = useChat({
    api: "/api/ai/chat",
    body: {
      conversationId,
      type: conversationType,
      language: practiceLanguage,
    },
    onFinish: (message) => {
      console.log("[AI Chat] Chat finished, message:", message)
    },
    onResponse: (response) => {
      console.log("[AI Chat] Response received:", response.status)
      const convId = response.headers.get("X-Conversation-Id")
      if (convId && !conversationId) {
        console.log("[AI Chat] Setting conversation ID:", convId)
        setConversationId(convId)
      }
    },
  })

  const t = translations[uiLanguage]

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[AI Practice] Send button clicked")
    console.log("[AI Practice] Input value:", input)
    console.log("[AI Practice] Input length:", input?.length)
    console.log("[AI Practice] Is loading:", isLoading)
    console.log("[AI Practice] Conversation ID:", conversationId)
    console.log("[AI Practice] Practice language:", practiceLanguage)
    console.log("[AI Practice] Conversation type:", conversationType)

    if (!input || !input.trim()) {
      console.warn("[AI Practice] Input is empty, not submitting")
      return
    }

    try {
      console.log("[AI Practice] Calling handleSubmit...")
      await handleSubmit(e)
      console.log("[AI Practice] handleSubmit completed")
    } catch (error) {
      console.error("[AI Practice] Error in handleSubmit:", error)
    }
  }

  const startNewConversation = () => {
    setConversationId(undefined)
    setScenario(null)
  }

  const handleStartScenario = (newScenario: any) => {
    setScenario(newScenario)
    append({ role: "user", content: newScenario.starterMessage })
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />

      <SidebarLayout>
        <div className="mx-auto max-w-5xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="mb-4">
          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            {t.aiPractice || "AI Conversation Practice"}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t.aiPracticeSubtitle || "Practice real conversations with AI tutors in your target language"}
          </p>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-4">
          <Card className="p-4 h-fit space-y-4">
            <h3 className="font-serif font-semibold">{t.settings || "Settings"}</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">{t.practiceLanguage || "Practice Language"}</label>
                <select
                  value={practiceLanguage}
                  onChange={(e) => setPracticeLanguage(e.target.value)}
                  className="w-full p-2 border rounded-md bg-background text-sm"
                >
                  <option value="english">English</option>
                  <option value="shona">Shona</option>
                  <option value="ndebele">Ndebele</option>
                  <option value="chinese">Chinese</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">{t.conversationType || "Conversation Type"}</label>
                <Tabs value={conversationType} onValueChange={(v) => setConversationType(v as any)}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="practice" className="text-xs px-3 py-2 flex items-center justify-center gap-1">
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.practice || "Practice"}</span>
                    </TabsTrigger>
                    <TabsTrigger value="scenario" className="text-xs px-3 py-2 flex items-center justify-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.scenario || "Scenario"}</span>
                    </TabsTrigger>
                    <TabsTrigger value="translation_help" className="text-xs px-3 py-2 flex items-center justify-center gap-1">
                      <Globe className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.help || "Help"}</span>
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <Button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  console.log("[AI Practice] New Conversation button clicked")
                  startNewConversation()
                }}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {t.newConversation || "New Conversation"}
              </Button>
            </div>

            {conversationType === "scenario" && !scenario && (
              <ScenarioGenerator language={practiceLanguage} onStartScenario={handleStartScenario} />
            )}

            {conversationType === "translation_help" && <TranslationHelper />}
          </Card>

          <Card className="flex flex-col h-[calc(100vh-16rem)]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
                  <p className="text-lg font-medium mb-1">{t.startChatting || "Start chatting with your AI tutor"}</p>
                  <p className="text-sm">
                    {t.chatHint || "Ask questions, practice phrases, or simulate real conversations"}
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        message.role === "user" ? "bg-[#5f5873] text-white dark:bg-[#7c73e6]" : "bg-muted text-foreground"
                      }`}
                    >
                      {typeof message.content === "string" ? (
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={handleInputChange}
                  placeholder={t.typeMessage || "Type your message..."}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={!input || !input.trim() || isLoading} size="icon">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </form>
          </Card>
        </div>
        </div>
      </SidebarLayout>
    </div>
  )
}
