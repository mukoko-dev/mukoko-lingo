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
    const response = await stytchClient.otps.email.loginOrCreate({
      email,
      expiration_minutes: OTP_EXPIRATION_MINUTES,
      login_template_id: STYTCH_TEMPLATES.OTP,
      signup_template_id: STYTCH_TEMPLATES.OTP,
    })
    return res.status(200).json({
      success: true,
      message: 'OTP sent to email',
      method_id: response.email_id,
    })
  } catch (error: any) {
    return res.status(400).json({ error: error.error_message || 'Failed to send OTP' })
  }
}
