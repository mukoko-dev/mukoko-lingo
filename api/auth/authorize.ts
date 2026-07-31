import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { workos, WORKOS_CLIENT_ID } from '../_lib/auth-middleware'
import { WORKOS_REDIRECTS } from '../../lib/workos/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { redirect_uri, screen_hint } = req.body || {}
  const redirectUri = redirect_uri || WORKOS_REDIRECTS.MOBILE

  try {
    const { url, state, codeVerifier } = await workos.userManagement.getAuthorizationUrlWithPKCE({
      clientId: WORKOS_CLIENT_ID,
      provider: 'authkit',
      redirectUri,
      screenHint: screen_hint === 'sign-up' ? 'sign-up' : undefined,
    })

    return res.status(200).json({ url, state, code_verifier: codeVerifier })
  } catch (error: any) {
    console.error('[mukoko][auth] Failed to build authorization URL:', error.error_message || error.message)
    if (error.error_type === 'configuration_error') {
      return res.status(500).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    return res.status(500).json({ error: 'Failed to start sign-in' })
  }
}
