import { streamText, convertToModelMessages, type UIMessage } from "ai"
import { createServerClient } from "@/lib/supabase/server"
import { moderateContent } from "@/lib/ai/moderation"
import { haiku } from "@/lib/ai/config"
import { buildSkillsAwarePrompt } from "@/lib/ai/skills-aware-prompts"

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      messages,
      conversationId,
      type,
      language,
    }: {
      messages: UIMessage[]
      conversationId?: string
      type: "practice" | "scenario" | "translation_help"
      language: string
    } = await req.json()

    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    if (lastUserMessage) {
      const textContent =
        typeof lastUserMessage.content === "string" ? lastUserMessage.content : lastUserMessage.content?.text || ""

      const moderation = await moderateContent(textContent)

      if (moderation.flagged) {
        // Store flagged message
        if (conversationId) {
          await supabase.from("ai_messages").insert({
            conversation_id: conversationId,
            role: "user",
            content: textContent,
            moderation_flagged: true,
            moderation_categories: moderation.categories,
          })
        }

        return Response.json(
          {
            error:
              "Your message was flagged for inappropriate content. Please keep conversations respectful and appropriate.",
            moderationDetails: moderation.reason,
          },
          { status: 400 },
        )
      }
    }

    // Create or update conversation
    let convId = conversationId
    if (!convId) {
      const firstMessageContent = messages[0]?.content
      const title = typeof firstMessageContent === "string" ? firstMessageContent.substring(0, 50) : "New conversation"

      const { data: newConv } = await supabase
        .from("ai_conversations")
        .insert({
          user_id: user.id,
          type,
          language,
          title,
        })
        .select()
        .single()

      convId = newConv?.id
    }

    // Build skills-aware system prompt
    // CRITICAL: This reads user's actual proficiency from assessments
    const systemPrompt = await buildSkillsAwarePrompt(user.id, type, language)

    const result = streamText({
      model: haiku,
      system: systemPrompt,
      messages: convertToModelMessages(messages),
      maxTokens: 1000,
      temperature: 0.8,
      abortSignal: req.signal,
    })

    const response = result.toUIMessageStreamResponse({
      headers: {
        "X-Conversation-Id": convId || "",
      },
    })

    // Store messages in database asynchronously (don't block response)
    const fullText = await result.text

    // Store messages in database after streaming completes
    // This runs asynchronously and doesn't block the response
    if (convId) {
      const userMsg =
        typeof lastUserMessage?.content === "string"
          ? lastUserMessage.content
          : lastUserMessage?.content?.text || ""

      if (userMsg) {
        supabase.from("ai_messages").insert({
          conversation_id: convId,
          role: "user",
          content: userMsg,
        }).then(() => {
          // User message stored
        })
      }

      supabase.from("ai_messages").insert({
        conversation_id: convId,
        role: "assistant",
        content: fullText,
      }).then(() => {
        // Assistant message stored
        // Update conversation timestamp
        supabase.from("ai_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId)
      })
    }

    return response
  } catch (error) {
    console.error("[AI Chat Error]:", error)

    // Provide more detailed error information
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[AI Chat Error Details]:", errorMessage)

    // Check if it's an API key issue
    if (errorMessage.includes('API key') || errorMessage.includes('authentication')) {
      console.error("⚠️ API Authentication Error: Check that ANTHROPIC_API_KEY is set correctly")
      return Response.json({
        error: "API authentication failed. Please check server configuration."
      }, { status: 500 })
    }

    return Response.json({
      error: "Failed to process chat",
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    }, { status: 500 })
  }
}
