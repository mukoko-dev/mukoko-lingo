import { generateText } from "ai"
import { haiku } from "@/lib/ai/config"

export const maxDuration = 30

// API endpoint to test AI configuration and actual AI response
export async function GET() {
  const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY
  const hasLegacyKey = !!process.env.ANTHROPIC_API_KEY
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.ANTHROPIC_API_KEY
  const apiKeyPrefix = apiKey?.substring(0, 10) || 'not set'
  const hasOIDC = !!process.env.VERCEL_OIDC_TOKEN

  const configCheck = {
    configured: hasGatewayKey || hasLegacyKey,
    usingGatewayKey: hasGatewayKey,
    usingLegacyKey: hasLegacyKey && !hasGatewayKey,
    apiKeyPrefix: apiKey ? apiKeyPrefix + '...' : 'not set',
    hasVercelOIDC: hasOIDC,
    environment: process.env.NODE_ENV,
    message: hasGatewayKey
      ? '✅ AI Gateway is configured correctly with AI_GATEWAY_API_KEY'
      : hasLegacyKey
      ? '⚠️ Using legacy ANTHROPIC_API_KEY. Please migrate to AI_GATEWAY_API_KEY'
      : '❌ AI_GATEWAY_API_KEY is not set. Add your Vercel AI Gateway key to environment variables.'
  }

  // If not configured, return early
  if (!configCheck.configured) {
    return Response.json({
      ...configCheck,
      aiTest: {
        attempted: false,
        reason: "No API key configured"
      }
    })
  }

  // Try to actually get a response from the AI
  try {
    const hardcodedQuestion = "Hello! Can you tell me what 2+2 equals? Keep your answer brief."

    const result = await generateText({
      model: haiku,
      prompt: hardcodedQuestion,
      maxTokens: 100,
      temperature: 0.7,
    })

    return Response.json({
      ...configCheck,
      aiTest: {
        success: true,
        question: hardcodedQuestion,
        answer: result.text,
        model: "claude-haiku-4.5",
        timestamp: new Date().toISOString(),
      }
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"

    return Response.json({
      ...configCheck,
      aiTest: {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      }
    }, { status: 500 })
  }
}
