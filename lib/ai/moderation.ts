import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const moderationSchema = z.object({
  flagged: z.boolean(),
  categories: z.object({
    sexual: z.boolean(),
    hate: z.boolean(),
    harassment: z.boolean(),
    violence: z.boolean(),
    self_harm: z.boolean(),
    abuse: z.boolean(),
  }),
  reason: z.string().optional(),
})

export async function moderateContent(
  content: string,
  userId?: string,
  contentType?: "message" | "phrase" | "translation",
  contentId?: string,
) {
  try {
    const { object } = await generateObject({
      model: "anthropic/claude-haiku-4.5",
      schema: moderationSchema,
      prompt: `You are a content moderation system. Analyze the following text for inappropriate content including sexual content, hate speech, harassment, violence, self-harm, or abuse. Be strict but fair.

Text to moderate: "${content}"

Return a JSON object indicating if the content is flagged and which categories apply.`,
      maxOutputTokens: 500,
    })

    if (object.flagged && userId) {
      try {
        const supabase = await createClient()
        await supabase.from("moderation_alerts").insert({
          user_id: userId,
          content_type: contentType || "message",
          content_id: contentId,
          content_text: content.substring(0, 500),
          flagged_reason: object.reason || "Content flagged by AI moderation",
          categories: object.categories,
          status: "pending",
        })
      } catch (dbError) {
        console.error("[v0] Failed to log moderation alert:", dbError)
        // Don't fail the moderation check if database insert fails
      }
    }

    return object
  } catch (error) {
    console.error("[v0] Moderation error:", error)
    // On error, flag content for manual review
    return {
      flagged: true,
      categories: {
        sexual: false,
        hate: false,
        harassment: false,
        violence: false,
        self_harm: false,
        abuse: false,
      },
      reason: "Moderation service error - flagged for manual review",
    }
  }
}
