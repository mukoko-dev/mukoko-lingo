import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import { OTP_EXPIRATION_MINUTES } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone_number } = req.body || {}
  if (!phone_number) {
    return res.status(400).json({ error: 'Phone number is required' })
  }

  // Validate phone number format (E.164: +[country code][number])
  const phoneRegex = /^\+[1-9]\d{6,14}$/
  if (!phoneRegex.test(phone_number)) {
    return res.status(400).json({ error: 'Phone number must be in E.164 format (e.g. +263771234567)' })
  }

  try {
    await stytchClient.otps.whatsapp.loginOrCreate({
      phone_number,
      expiration_minutes: OTP_EXPIRATION_MINUTES,
    })
    return res.status(200).json({ success: true, message: 'OTP sent via WhatsApp' })
  } catch (error: any) {
    return res.status(400).json({ error: error.error_message || 'Failed to send WhatsApp OTP' })
  }
}
