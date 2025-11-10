import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { moderateContent } from "@/lib/ai/moderation"

const translationHelpSchema = z.object({
  translations: z.object({
    english: z.string(),
    shona: z.string(),
    ndebele: z.string(),
    chinese: z.string(),
  }),
  pronunciation: z.object({
    english: z.string(),
    shona: z.string(),
    ndebele: z.string(),
    chinese: z.string(),
  }),
  nuances: z.string(),
  commonMistakes: z.array(z.string()),
  culturalContext: z.string(),
  alternatives: z.array(z.string()),
  formalityLevel: z.enum(["very_formal", "formal", "neutral", "informal", "very_informal"]),
  whenToUse: z.string(),
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
          error: "Content flagged as inappropriate",
          details: moderation.reason,
        },
        { status: 400 },
      )
    }

    const { object } = await generateObject({
      model: "anthropic/claude-haiku-4.5",
      schema: translationHelpSchema,
      prompt: `You are an expert translator and language teacher specializing in English, Shona, Ndebele, and Chinese. Provide comprehensive translation help for this phrase.

Original phrase: "${text}"
Source language: ${sourceLanguage}

Provide:
1. Accurate translations in all four languages
2. Pronunciation guides (using IPA or simple phonetics)
3. Nuances - explain subtle differences in meaning across languages
4. Common Mistakes - what learners often get wrong with this phrase
5. Cultural Context - when/where/how this is used in African vs Chinese cultures
6. Alternatives - other ways to express the same idea
7. Formality Level - how formal/informal this phrase is
8. When To Use - specific situations where this phrase is appropriate

For Shona and Ndebele, respect cultural norms, honorifics, and age-based politeness. For Chinese, use Simplified characters and explain tones if relevant.`,
      maxOutputTokens: 2000,
    })

    // Optionally save to database if user wants to keep it
    if (req.headers.get("x-save-translation") === "true") {
      await supabase.from("ai_generated_phrases").insert({
        user_id: user.id,
        english: object.translations.english,
        shona: object.translations.shona,
        ndebele: object.translations.ndebele,
        chinese: object.translations.chinese,
        english_pronunciation: object.pronunciation.english,
        shona_pronunciation: object.pronunciation.shona,
        ndebele_pronunciation: object.pronunciation.ndebele,
        chinese_pronunciation: object.pronunciation.chinese,
        context: object.culturalContext,
        category: "custom",
      })
    }

    return Response.json({ help: object })
  } catch (error) {
    console.error("[v0] Translation help error:", error)
    return Response.json({ error: "Failed to generate translation help" }, { status: 500 })
  }
}
