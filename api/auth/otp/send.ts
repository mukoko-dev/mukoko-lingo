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
    console.error('[mukoko][auth] OTP send failed:', error.error_message || error.message)
    const errorType = error.error_type || ''
    let message: string
    let status: number
    if (errorType === 'configuration_error') {
      message = 'Authentication service is temporarily unavailable.'
      status = 500
    } else if (errorType.includes('invalid_email')) {
      message = 'Invalid email address. Please check and try again.'
      status = 400
    } else if (errorType.includes('too_many_requests') || error.status_code === 429) {
      message = 'Too many attempts. Please wait a moment and try again.'
      status = 429
    } else if (errorType.includes('template') || (error.error_message || '').includes('template')) {
      // Template ID doesn't exist in Stytch — fall back to default templates
      try {
        const fallbackResponse = await stytchClient.otps.email.loginOrCreate({
          email,
          expiration_minutes: OTP_EXPIRATION_MINUTES,
        })
        return res.status(200).json({
          success: true,
          message: 'OTP sent to email',
          method_id: fallbackResponse.email_id,
        })
      } catch (fallbackError: any) {
        message = fallbackError.error_message || 'Failed to send verification code. Please try again.'
        status = fallbackError.status_code || 500
      }
    } else {
      message = error.error_message || 'Failed to send verification code. Please try again.'
      status = error.status_code || 500
    }
    return res.status(status!).json({ error: message! })
  }
}
