import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { stytchClient } from '../_lib/auth-middleware'
import prisma from '../_lib/prisma'
import { SESSION_DURATION_MINUTES } from '../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const response = await stytchClient.passwords.create({
      email,
      password,
      session_duration_minutes: SESSION_DURATION_MINUTES,
    })

    const stytchUserId = response.user.user_id
    const userEmail = response.user.emails?.[0]?.email || email

    // Create profile in MongoDB
    const profile = await prisma.profile.create({
      data: {
        stytchUserId,
        email: userEmail,
        displayName: userEmail.split('@')[0],
      },
    })

    return res.status(201).json({
      session_token: response.session_token,
      session_jwt: response.session_jwt,
      user: {
        user_id: stytchUserId,
        email: userEmail,
        name: response.user.name,
        created_at: response.user.created_at,
        status: profile.status,
      },
      expires_at: response.session?.expires_at,
    })
  } catch (error: any) {
    const message = error.error_message || error.message || 'Registration failed'
    const status = message.includes('already exists') ? 409 : 400
    return res.status(status).json({ error: message })
  }
}
