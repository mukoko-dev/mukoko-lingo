// API endpoint to test AI configuration
export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const apiKeyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 8) || 'not set'
  const hasOIDC = !!process.env.VERCEL_OIDC_TOKEN

  return Response.json({
    configured: hasApiKey,
    apiKeyPrefix: hasApiKey ? apiKeyPrefix + '...' : 'not set',
    hasVercelOIDC: hasOIDC,
    environment: process.env.NODE_ENV,
    message: hasApiKey
      ? '✅ AI is configured correctly'
      : '❌ ANTHROPIC_API_KEY is not set. Add your Vercel AI Gateway key to environment variables.'
  })
}
