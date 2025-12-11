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

// Primary models - DeepSeek (cost-effective, high quality)
export const deepseek = 'deepseek/deepseek-v3.2'
export const deepseekThinking = 'deepseek/deepseek-v3.2-thinking'
export const deepseekR1 = 'deepseek/deepseek-r1'

// Qwen models - Alibaba's models via Vercel AI Gateway
export const qwen = 'alibaba/qwen3-max'
export const qwenCoder = 'alibaba/qwen3-coder'
export const qwenThinking = 'alibaba/qwen3-235b-a22b-thinking'

// Default model for all AI operations (tutoring, chat, assessments)
// Using DeepSeek v3.2 as primary - excellent multilingual support, cost-effective
export const defaultModel = deepseek

// Legacy exports for backward compatibility (mapped to new models)
export const haiku = deepseek
export const sonnet = deepseekThinking
