import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { moderateContent } from "@/lib/ai/moderation"

const translationSchema = z.object({
  english: z.string(),
  shona: z.string(),
  ndebele: z.string(),
  chinese: z.string(),
  english_pronunciation: z.string(),
  shona_pronunciation: z.string(),
  ndebele_pronunciation: z.string(),
  chinese_pronunciation: z.string(),
  context: z.string(),
  category: z.string(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, sourceLanguage } = await req.json()

    // Moderate input
    const moderation = await moderateContent(text)
    if (moderation.flagged) {
      return Response.json(
        {
          error: "Content was flagged as inappropriate",
          details: moderation.reason,
        },
        { status: 400 },
      )
    }

    // Generate translation
    const { object } = await generateObject({
      model: "anthropic/claude-haiku-4.5",
      schema: translationSchema,
      prompt: `Translate the following ${sourceLanguage} phrase to English, Shona, Ndebele, and Chinese. Provide accurate pronunciations and context about when to use this phrase. Categorize it appropriately.

Phrase: "${text}"

Important: For Shona and Ndebele, use proper grammar and common everyday usage. For Chinese, use Simplified Chinese characters. Provide realistic pronunciation guides.`,
      maxOutputTokens: 1500,
    })

    // Store in database
    const { data: savedPhrase, error: dbError } = await supabase
      .from("ai_generated_phrases")
      .insert({
        user_id: user.id,
        ...object,
      })
      .select()
      .single()

    if (dbError) {
      console.error("[v0] Database error:", dbError)
      return Response.json({ error: "Failed to save translation" }, { status: 500 })
    }

    return Response.json({ translation: savedPhrase })
  } catch (error) {
    console.error("[v0] Translation error:", error)
    return Response.json({ error: "Failed to generate translation" }, { status: 500 })
  }
}
