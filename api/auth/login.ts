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
    const response = await stytchClient.passwords.authenticate({
      email,
      password,
      session_duration_minutes: SESSION_DURATION_MINUTES,
    })

    const stytchUserId = response.user.user_id
    const userEmail = response.user.emails?.[0]?.email || email

    // Upsert profile in MongoDB
    let profile = await prisma.profile.findUnique({ where: { stytchUserId } })
    if (!profile) {
      profile = await prisma.profile.create({
        data: {
          stytchUserId,
          email: userEmail,
          displayName: response.user.name?.first_name || userEmail.split('@')[0],
        },
      })
    } else {
      await prisma.profile.update({
        where: { stytchUserId },
        data: { lastActive: new Date() },
      })
    }

    return res.status(200).json({
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
    const message = error.error_message || error.message || 'Login failed'
    return res.status(401).json({ error: message })
  }
}
