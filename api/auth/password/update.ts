import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import { STYTCH_TEMPLATES, STYTCH_REDIRECTS } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { session_token, new_password } = req.body || {}
  if (!session_token || !new_password) {
    return res.status(400).json({ error: 'Session token and new password are required' })
  }

  try {
    // Validate session first
    const sessionResponse = await stytchClient.sessions.authenticate({ session_token })
    const email = sessionResponse.user.emails?.[0]?.email
    if (!email) {
      return res.status(400).json({ error: 'No email associated with this session' })
    }

    // Reset password using existing session context
    await stytchClient.passwords.strengthCheck({ password: new_password })

    // Send a password reset email so the user can set a new password via link
    const resetParams: Record<string, any> = {
      email,
      reset_password_redirect_url: STYTCH_REDIRECTS.MOBILE,
    }
    if (STYTCH_TEMPLATES.RESET_PASSWORD) {
      resetParams.reset_password_template_id = STYTCH_TEMPLATES.RESET_PASSWORD
    }
    await stytchClient.passwords.email.resetStart(resetParams as any)

    return res.status(200).json({
      success: true,
      message: 'Password update initiated. Check your email for confirmation.',
      user: {
        user_id: sessionResponse.user.user_id,
        email,
      },
    })
  } catch (error: any) {
    console.error('[mukoko][auth] Password update failed:', error.error_message || error.message)
    if (error.error_type === 'configuration_error') {
      return res.status(500).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    return res.status(error.status_code || 400).json({ error: error.error_message || 'Failed to update password' })
  }
}
