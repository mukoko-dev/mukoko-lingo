import { createAnthropic } from '@ai-sdk/anthropic'

// Create Anthropic provider instance
// Vercel AI Gateway is automatically used when deployed on Vercel
// The gateway handles API keys and rate limiting transparently
export const anthropic = createAnthropic({
  // API key is optional - Vercel AI Gateway handles authentication
  apiKey: process.env.ANTHROPIC_API_KEY || 'placeholder',
})

// Export model instances for easy reuse
export const haiku = anthropic('claude-3-5-haiku-20241022')
export const sonnet = anthropic('claude-3-7-sonnet-20250219')
