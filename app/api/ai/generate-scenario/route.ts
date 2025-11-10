import { generateObject } from "ai"
import { z } from "zod"
import { createServerClient } from "@/lib/supabase/server"

const scenarioSchema = z.object({
  title: z.string(),
  setting: z.string(),
  yourRole: z.string(),
  theirRole: z.string(),
  context: z.string(),
  objectives: z.array(z.string()),
  starterMessage: z.string(),
  suggestedPhrases: z.array(z.string()),
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

    const { language, scenarioType } = await req.json()

    const scenarioPrompts: Record<string, string> = {
      market: `A busy African market where you need to buy vegetables and negotiate prices`,
      restaurant: `Ordering food at a local restaurant and asking about ingredients`,
      taxi: `Negotiating with a taxi driver about destination and fare`,
      hospital: `Visiting a hospital to describe symptoms and understand doctor's advice`,
      school: `Parent-teacher meeting discussing a child's progress`,
      office: `Job interview or meeting with colleagues`,
      shop: `Shopping for clothes and asking about sizes and prices`,
      home: `Inviting neighbors over and making introductions`,
    }

    const { object } = await generateObject({
      model: "anthropic/claude-haiku-4.5",
      schema: scenarioSchema,
      prompt: `Generate a realistic conversation scenario for language learning in ${language}. 

Scenario type: ${scenarioType}
Context: ${scenarioPrompts[scenarioType] || scenarioType}

Create a detailed scenario with:
1. Title - engaging title for the scenario
2. Setting - where this conversation takes place  
3. Your Role - who the learner plays (customer, patient, parent, etc.)
4. Their Role - who the AI will play
5. Context - detailed background of the situation
6. Objectives - 3-5 specific goals to achieve in this conversation
7. Starter Message - how the AI character begins the conversation in ${language}
8. Suggested Phrases - 5-7 useful phrases for this scenario in ${language}

Make it authentic to African cultural contexts, especially for Shona and Ndebele scenarios. Use appropriate greetings, politeness levels, and cultural norms.`,
      maxOutputTokens: 1500,
    })

    return Response.json({ scenario: object })
  } catch (error) {
    console.error("[v0] Scenario generation error:", error)
    return Response.json({ error: "Failed to generate scenario" }, { status: 500 })
  }
}
