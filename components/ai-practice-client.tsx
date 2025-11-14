"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Send, Loader2, Sparkles } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"

type ConversationType = "practice" | "scenario" | "translation_help"
type Language = "english" | "shona" | "ndebele" | "chinese"

export function AIPracticeClient() {
  const [language, setLanguage] = useState<Language>("english")
  const [conversationType, setConversationType] = useState<ConversationType>("practice")
  const [conversationId, setConversationId] = useState<string>()

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/ai/chat",
    body: {
      conversationId,
      type: conversationType,
      language,
    },
    onResponse: (response) => {
      const convId = response.headers.get("X-Conversation-Id")
      if (convId && !conversationId) {
        setConversationId(convId)
      }
    },
  })

  const handleNewConversation = () => {
    setConversationId(undefined)
  }

  const getTypeLabel = () => {
    switch (conversationType) {
      case "practice":
        return "Conversation Practice"
      case "scenario":
        return "Scenario-Based Learning"
      case "translation_help":
        return "Translation Help"
    }
  }

  const getTypeDescription = () => {
    switch (conversationType) {
      case "practice":
        return "Have a natural conversation to practice your language skills."
      case "scenario":
        return "Practice specific situations like ordering food or asking for directions."
      case "translation_help":
        return "Get help translating phrases and understanding grammar."
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">AI Conversation Practice</h1>
            <p className="text-muted-foreground">
              Practice real conversations with AI in your target language
            </p>
          </div>

          <div className="grid lg:grid-cols-[340px_1fr] gap-6">
            {/* Settings Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Language Selection */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Practice Language</label>
                    <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="shona">Shona</SelectItem>
                        <SelectItem value="ndebele">Ndebele</SelectItem>
                        <SelectItem value="chinese">Chinese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Conversation Type */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conversation Type</label>
                    <Select value={conversationType} onValueChange={(v) => setConversationType(v as ConversationType)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="practice">Practice</SelectItem>
                        <SelectItem value="scenario">Scenario</SelectItem>
                        <SelectItem value="translation_help">Translation Help</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* New Conversation Button */}
                  <Button
                    type="button"
                    onClick={handleNewConversation}
                    variant="outline"
                    className="w-full"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    New Conversation
                  </Button>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-medium text-foreground">{getTypeLabel()}</p>
                    <p>{getTypeDescription()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chat Panel */}
            <Card className="flex flex-col h-[calc(100vh-200px)]">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <MessageCircle className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">Start a conversation</p>
                    <p className="text-sm">Type a message below to begin practicing</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-3 ${
                          message.role === "user"
                            ? "bg-[#5f5873] text-white dark:bg-[#7c73e6]"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Type your message..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!input.trim() || isLoading} size="icon">
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </Card>
          </div>
        </div>
      </SidebarLayout>
    </div>
  )
}
