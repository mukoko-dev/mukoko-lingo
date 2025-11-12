import { createAnthropic } from '@ai-sdk/anthropic'

// Create Anthropic provider instance
// For Vercel AI Gateway: Set ANTHROPIC_API_KEY to your gateway API key
// The gateway handles authentication via VERCEL_OIDC_TOKEN automatically
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('⚠️ ANTHROPIC_API_KEY is not set. AI features will not work.')
  console.warn('Add your Vercel AI Gateway API key to environment variables.')
}

export const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Export model instances for easy reuse
export const haiku = anthropic('claude-3-5-haiku-20241022')
export const sonnet = anthropic('claude-3-7-sonnet-20250219')
