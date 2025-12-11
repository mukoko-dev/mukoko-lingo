"use client"

import { useState } from "react"
import Image from "next/image"
// @ts-ignore - useChat types from ai package
import { useChat } from "@ai-sdk/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Loader2, AlertCircle } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ConversationType = "practice" | "scenario" | "translation_help"
type Language = "english" | "shona" | "ndebele" | "chinese"

export function AIPracticeClient() {
  const [language, setLanguage] = useState<Language>("english")
  const [conversationType, setConversationType] = useState<ConversationType>("practice")

  // @ts-ignore - useChat runtime API differs from types
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
  } = useChat({
    // @ts-ignore
    body: {
      type: conversationType,
      language,
    },
    id: `chat-${conversationType}-${language}`, // Unique ID prevents state conflicts
  })

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        {/* Error Alert at top of page */}
        {error && (
          <div className="fixed top-0 left-0 right-0 z-50 lg:left-64 p-4">
            <Alert variant="destructive" className="shadow-lg">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="ml-2">
                <strong>Error:</strong> {error.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="flex flex-col h-[calc(100vh-56px)] lg:h-screen">
          {messages.length === 0 ? (
            /* Empty state - centered input with Shamwari mascot */
            <div className="flex-1 flex flex-col items-center justify-center px-4 pb-32">
              <div className="w-full max-w-2xl space-y-8">
                <div className="text-center space-y-4">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <Image
                      src="/Shamwari_logo_Mascot.svg"
                      alt="Shamwari - Your AI Language Tutor"
                      width={96}
                      height={96}
                      className="w-full h-full object-contain drop-shadow-lg"
                      priority
                    />
                  </div>
                  <h1 className="text-4xl font-bold">Meet Shamwari</h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    Your friendly AI language tutor. &quot;Shamwari&quot; means &quot;friend&quot; in Shona!
                  </p>
                  <div className="flex items-center justify-center gap-2 text-lg text-muted-foreground">
                    <span>Start a conversation to practice</span>
                    <Select value={language} onValueChange={(value) => setLanguage(value as Language)}>
                      <SelectTrigger className="w-auto h-auto p-0 border-0 bg-transparent hover:bg-transparent focus:ring-0 focus:ring-offset-0 gap-1 text-lg font-normal shadow-none">
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
                </div>

                <form onSubmit={handleSubmit} className="w-full">
                  <div className="relative flex items-center gap-2 p-2 bg-white dark:bg-[#1a1a1a] rounded-2xl border-2 border-border focus-within:border-primary-700 dark:focus-within:border-primary-600 transition-colors shadow-lg">
                    <Input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Type your message..."
                      disabled={isLoading}
                      className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      disabled={!input?.trim() || isLoading}
                      size="icon"
                      className="rounded-xl h-10 w-10 shrink-0"
                    >
                      {isLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Press Enter to send • Practicing: {conversationType === "practice" ? "Conversation" : conversationType === "scenario" ? "Scenario" : "Translation"}
                  </p>
                </form>
              </div>
            </div>
          ) : (
            /* Chat view - messages with bottom input */
            <>
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
                {messages.map((message: any) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} gap-3`}
                  >
                    {/* Shamwari avatar for AI messages */}
                    {message.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-primary-700/20 to-primary-600/10">
                        <Image
                          src="/Shamwari_logo_Mascot.svg"
                          alt="Shamwari"
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === "user"
                          ? "bg-[#5f5873] text-white dark:bg-[#7c73e6]"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start gap-3">
                    <div className="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-gradient-to-br from-primary-700/20 to-primary-600/10">
                      <Image
                        src="/Shamwari_logo_Mascot.svg"
                        alt="Shamwari"
                        width={32}
                        height={32}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="bg-muted rounded-2xl px-4 py-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                )}
              </div>

              {/* Fixed bottom input */}
              <div className="border-t bg-white dark:bg-background p-4">
                <div className="max-w-4xl mx-auto">
                  <form onSubmit={handleSubmit}>
                    <div className="relative flex items-center gap-2 p-2 bg-background dark:bg-[#1a1a1a] rounded-2xl border-2 border-border focus-within:border-primary-700 dark:focus-within:border-primary-600 transition-colors">
                      <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Type your message..."
                        disabled={isLoading}
                        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base px-4"
                      />
                      <Button
                        type="submit"
                        disabled={!input?.trim() || isLoading}
                        size="icon"
                        className="rounded-xl h-10 w-10 shrink-0"
                      >
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Send className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
      </SidebarLayout>
    </div>
  )
}
