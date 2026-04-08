import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import { STYTCH_TEMPLATES, STYTCH_REDIRECTS } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, redirect_url } = req.body || {}
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const resetParams: Record<string, any> = {
      email,
      reset_password_redirect_url: redirect_url || STYTCH_REDIRECTS.MOBILE,
    }
    if (STYTCH_TEMPLATES.RESET_PASSWORD) {
      resetParams.reset_password_template_id = STYTCH_TEMPLATES.RESET_PASSWORD
    }
    await stytchClient.passwords.email.resetStart(resetParams as any)
    return res.status(200).json({ success: true, message: 'Password reset email sent' })
  } catch (error: any) {
    console.error('[mukoko][auth] Password reset failed:', error.error_message || error.message)
    // If template ID is invalid, retry without it
    if ((error.error_type || '').includes('template') || (error.error_message || '').includes('template')) {
      try {
        await stytchClient.passwords.email.resetStart({
          email,
          reset_password_redirect_url: redirect_url || STYTCH_REDIRECTS.MOBILE,
        } as any)
        return res.status(200).json({ success: true, message: 'Password reset email sent' })
      } catch {
        // Fall through to generic response
      }
    }
    if (error.error_type === 'configuration_error') {
      return res.status(500).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    // Don't reveal whether the email exists
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent' })
  }
}
