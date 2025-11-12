// API endpoint to test AI configuration
export async function GET() {
  const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY
  const hasLegacyKey = !!process.env.ANTHROPIC_API_KEY
  const apiKey = process.env.AI_GATEWAY_API_KEY || process.env.ANTHROPIC_API_KEY
  const apiKeyPrefix = apiKey?.substring(0, 10) || 'not set'
  const hasOIDC = !!process.env.VERCEL_OIDC_TOKEN

  return Response.json({
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
  })
}
