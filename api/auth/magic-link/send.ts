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
    await stytchClient.magicLinks.email.loginOrCreate({
      email,
      login_magic_link_url: redirect_url || 'mukokolingo://',
      signup_magic_link_url: redirect_url || 'mukokolingo://',
    })
    return res.status(200).json({ success: true, message: 'Magic link sent to email' })
  } catch (error: any) {
    return res.status(400).json({ error: error.error_message || 'Failed to send magic link' })
  }
}
