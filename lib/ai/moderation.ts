import { generateObject } from "ai"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { haiku } from "@/lib/ai/config"

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

/**
 * Get active guardrails from database
 */
async function getActiveGuardrails() {
  try {
    const supabase = await createClient()
    const { data: guardrails } = await supabase
      .from("guardrails")
      .select("category, name, description, prompt_guidance")
      .eq("is_enabled", true)

    const { data: customGuardrails } = await supabase
      .from("custom_guardrails")
      .select("name, description, keywords, pattern, prompt_guidance")
      .eq("is_enabled", true)

    return { guardrails: guardrails || [], customGuardrails: customGuardrails || [] }
  } catch (error) {
    console.error("[moderation] Failed to fetch guardrails:", error)
    // Fallback to default guardrails if database fails
    return { guardrails: [], customGuardrails: [] }
  }
}

/**
 * Build moderation prompt with active guardrails
 */
async function buildModerationPrompt(content: string): Promise<string> {
  const { guardrails, customGuardrails } = await getActiveGuardrails()

  let prompt = `You are a content moderation system for a multilingual language learning platform with users aged 13+. Analyze the following text for inappropriate content.

Text to moderate: "${content}"

`

  if (guardrails.length > 0) {
    prompt += `Active Content Guidelines:\n\n`
    guardrails.forEach((rule) => {
      prompt += `**${rule.name} (${rule.category})**\n`
      prompt += `${rule.description}\n`
      if (rule.prompt_guidance) {
        prompt += `Guidance: ${rule.prompt_guidance}\n`
      }
      prompt += `\n`
    })
  }

  if (customGuardrails.length > 0) {
    prompt += `\nCommunity-Specific Rules:\n\n`
    customGuardrails.forEach((rule) => {
      prompt += `**${rule.name}**\n`
      prompt += `${rule.description}\n`
      if (rule.keywords && rule.keywords.length > 0) {
        prompt += `Watch for: ${rule.keywords.join(", ")}\n`
      }
      if (rule.prompt_guidance) {
        prompt += `Guidance: ${rule.prompt_guidance}\n`
      }
      prompt += `\n`
    })
  }

  prompt += `\nReturn a JSON object indicating if the content is flagged and which categories apply (sexual, hate, harassment, violence, self_harm, abuse). Include a brief reason if flagged.`

  return prompt
}

export async function moderateContent(
  content: string,
  userId?: string,
  contentType?: "message" | "phrase" | "translation",
  contentId?: string,
) {
  try {
    const moderationPrompt = await buildModerationPrompt(content)

    const { object } = await generateObject({
      model: haiku,
      schema: moderationSchema,
      prompt: moderationPrompt,
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
