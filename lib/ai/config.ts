import { createAnthropic } from '@ai-sdk/anthropic'

// Create Anthropic provider instance
// When deployed on Vercel with VERCEL_OIDC_TOKEN, it uses Vercel AI Gateway automatically
// For local dev, you need to set ANTHROPIC_API_KEY in .env.local
export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Export model instances for easy reuse
export const haiku = anthropic('claude-3-5-haiku-20241022')
export const sonnet = anthropic('claude-3-7-sonnet-20250219')
