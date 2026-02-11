import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, redirect_url } = req.body || {}
  if (!email) {
    return res.status(400).json({ error: 'Email is required' })
  }

  try {
    await stytchClient.passwords.email.resetStart({
      email,
      reset_password_redirect_url: redirect_url || 'mukokolingo://reset-password',
    })
    return res.status(200).json({ success: true, message: 'Password reset email sent' })
  } catch (error: any) {
    // Don't reveal whether the email exists
    return res.status(200).json({ success: true, message: 'If that email exists, a reset link was sent' })
  }
}
