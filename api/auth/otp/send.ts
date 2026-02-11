import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import { STYTCH_TEMPLATES, OTP_EXPIRATION_MINUTES } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body || {}
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    const otpParams: Record<string, any> = {
      email,
      expiration_minutes: OTP_EXPIRATION_MINUTES,
    }
    if (STYTCH_TEMPLATES.OTP) {
      otpParams.login_template_id = STYTCH_TEMPLATES.OTP
      otpParams.signup_template_id = STYTCH_TEMPLATES.OTP
    }
    const response = await stytchClient.otps.email.loginOrCreate(otpParams as any)
    return res.status(200).json({
      success: true,
      message: 'OTP sent to email',
      method_id: response.email_id,
    })
  } catch (error: any) {
    const errorType = error.error_type || ''
    let message: string
    if (errorType.includes('invalid_email')) {
      message = 'Invalid email address. Please check and try again.'
    } else if (errorType.includes('too_many_requests') || error.status_code === 429) {
      message = 'Too many attempts. Please wait a moment and try again.'
    } else {
      message = error.error_message || 'Failed to send verification code. Please try again.'
    }
    return res.status(error.status_code || 400).json({ error: message })
  }
}
