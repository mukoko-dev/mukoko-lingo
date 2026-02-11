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

  const url = redirect_url || STYTCH_REDIRECTS.MOBILE

  try {
    const mlParams: Record<string, any> = {
      email,
      login_magic_link_url: url,
      signup_magic_link_url: url,
    }
    if (STYTCH_TEMPLATES.LOGIN) {
      mlParams.login_template_id = STYTCH_TEMPLATES.LOGIN
    }
    if (STYTCH_TEMPLATES.SIGNUP) {
      mlParams.signup_template_id = STYTCH_TEMPLATES.SIGNUP
    }
    await stytchClient.magicLinks.email.loginOrCreate(mlParams)
    return res.status(200).json({ success: true, message: 'Magic link sent to email' })
  } catch (error: any) {
    const errorType = error.error_type || ''
    let message: string
    if (errorType.includes('redirect_url') || errorType.includes('not_authorized')) {
      message = 'Magic link redirect URL is not configured. Please contact support.'
    } else if (errorType.includes('invalid_email')) {
      message = 'Invalid email address. Please check and try again.'
    } else if (errorType.includes('too_many_requests') || error.status_code === 429) {
      message = 'Too many attempts. Please wait a moment and try again.'
    } else {
      message = error.error_message || 'Failed to send magic link. Please try again.'
    }
    return res.status(error.status_code || 400).json({ error: message })
  }
}
