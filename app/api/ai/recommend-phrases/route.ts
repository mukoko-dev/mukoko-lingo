import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"
import { haiku } from "@/lib/ai/config"

const recommendationSchema = z.object({
  recommendations: z.array(
    z.object({
      phraseId: z.string().uuid(),
      reason: z.string(),
      score: z.number().min(0).max(100),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
    }),
  ),
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

    // Get user's progress data
    const { data: progress } = await supabase.from("phrase_progress").select("phrase_id, status").eq("user_id", user.id)

    const masteredIds = progress?.filter((p) => p.status === "mastered").map((p) => p.phrase_id) || []
    const practicedIds = progress?.filter((p) => p.status === "practiced").map((p) => p.phrase_id) || []
    const learningIds = progress?.filter((p) => p.status === "learning").map((p) => p.phrase_id) || []

    // Get phrases user hasn't started
    const { data: allPhrases } = await supabase
      .from("phrases")
      .select("id, english, category, context")
      .not("id", "in", `(${[...masteredIds, ...practicedIds, ...learningIds].join(",") || "null"})`)
      .limit(50)

    if (!allPhrases || allPhrases.length === 0) {
      return Response.json({ recommendations: [] })
    }

    // Get user's viewing history
    const { data: viewHistory } = await supabase
      .from("phrase_views")
      .select("phrase_id, phrases(category)")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(20)

    const mostViewedCategories = viewHistory?.reduce(
      (acc, v) => {
        const category = (v.phrases as any)?.category
        if (category) {
          acc[category] = (acc[category] || 0) + 1
        }
        return acc
      },
      {} as Record<string, number>,
    )

    // Use AI to analyze and recommend
    const { object } = await generateObject({
      model: haiku,
      schema: recommendationSchema,
      prompt: `You are a language learning recommendation system. Based on the user's learning history, suggest the next 5-10 phrases they should learn.

User has:
- Mastered: ${masteredIds.length} phrases
- Practiced: ${practicedIds.length} phrases  
- Currently learning: ${learningIds.length} phrases
- Most viewed categories: ${JSON.stringify(mostViewedCategories)}

Available phrases to recommend from:
${allPhrases.map((p) => `ID: ${p.id} | Category: ${p.category} | "${p.english}" | Context: ${p.context}`).join("\n")}

Provide recommendations with:
1. Phrase ID (must match exactly from the list above)
2. Reason why this phrase is recommended (be specific about learning progression or relevance)
3. Score (0-100, higher = better match)
4. Difficulty level (beginner, intermediate, advanced)

Prioritize:
- Phrases that build on what they've mastered
- Categories they're interested in
- Natural learning progression (simple to complex)
- Practical everyday phrases`,
      maxOutputTokens: 2000,
    })

    // Store recommendations
    const recommendationsToStore = object.recommendations.map((r) => ({
      user_id: user.id,
      phrase_id: r.phraseId,
      reason: r.reason,
      score: r.score,
    }))

    await supabase.from("ai_recommendations").insert(recommendationsToStore)

    // Fetch full phrase data for recommendations
    const { data: recommendedPhrases } = await supabase
      .from("phrases")
      .select("*")
      .in(
        "id",
        object.recommendations.map((r) => r.phraseId),
      )

    const enrichedRecommendations = object.recommendations.map((rec) => {
      const phrase = recommendedPhrases?.find((p) => p.id === rec.phraseId)
      return {
        ...rec,
        phrase,
      }
    })

    return Response.json({ recommendations: enrichedRecommendations })
  } catch (error) {
    console.error("[v0] Recommendation error:", error)
    return Response.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
