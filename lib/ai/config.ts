// Vercel AI Gateway Configuration
// When AI_GATEWAY_API_KEY is set, the 'ai' package automatically routes through the gateway
// Get your gateway API key from: https://vercel.com/dashboard/ai-gateway
const apiKey = process.env.AI_GATEWAY_API_KEY || ''

if (!apiKey) {
  console.warn('⚠️ AI_GATEWAY_API_KEY is not set. AI features will not work.')
  console.warn('Add your Vercel AI Gateway API key to environment variables as AI_GATEWAY_API_KEY.')
  console.warn('Get one from: https://vercel.com/dashboard/ai-gateway')
}

// Export model identifiers for Vercel AI Gateway
// Format: 'provider/model-name'
// The AI SDK automatically uses these with the gateway when AI_GATEWAY_API_KEY is set
// Just pass these strings directly to streamText() or generateText()
export const haiku = 'anthropic/claude-3-5-haiku-20241022'
export const sonnet = 'anthropic/claude-3-5-sonnet-20250219'
export const deepseek = 'deepseek/deepseek-v3.2-exp-thinking'
