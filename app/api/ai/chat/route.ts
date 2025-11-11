import { streamText } from "ai"
import { createServerClient } from "@/lib/supabase/server"
import { moderateContent } from "@/lib/ai/moderation"
import { haiku } from "@/lib/ai/config"
import { buildAISystemPrompt } from "@/lib/learning-standards"

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
      messages: any[]
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

    // Build system prompt using learning standards
    const systemPrompt = await buildAISystemPrompt(user.id, type, language)

    const result = streamText({
      model: haiku,
      system: systemPrompt,
      messages,
      maxOutputTokens: 1000,
      temperature: 0.8,
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse({
      async onFinish({ text }) {
        // Store messages in database
        if (convId) {
          const userMsg =
            typeof lastUserMessage?.content === "string"
              ? lastUserMessage.content
              : lastUserMessage?.content?.text || ""

          if (userMsg) {
            await supabase.from("ai_messages").insert({
              conversation_id: convId,
              role: "user",
              content: userMsg,
            })
          }

          await supabase.from("ai_messages").insert({
            conversation_id: convId,
            role: "assistant",
            content: text,
          })

          // Update conversation timestamp
          await supabase.from("ai_conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId)
        }
      },
      headers: {
        "X-Conversation-Id": convId || "",
      },
    })
  } catch (error) {
    console.error("[v0] AI chat error:", error)
    return Response.json({ error: "Failed to process chat" }, { status: 500 })
  }
}
