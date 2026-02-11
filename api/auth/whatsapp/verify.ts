import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import prisma from '../../_lib/prisma'
import { SESSION_DURATION_MINUTES } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { phone_number, code } = req.body || {}
  if (!phone_number || !code) {
    return res.status(400).json({ error: 'Phone number and code are required' })
  }

  try {
    const response = await stytchClient.otps.authenticate({
      method_id: phone_number,
      code,
      session_duration_minutes: SESSION_DURATION_MINUTES,
    })

    const stytchUserId = response.user.user_id
    const email = response.user.emails?.[0]?.email || ''
    const phone = response.user.phone_numbers?.[0]?.phone_number || phone_number

    // Upsert profile
    await prisma.profile.upsert({
      where: { stytchUserId },
      create: {
        stytchUserId,
        email: email || `whatsapp_${phone.replace(/\+/g, '')}@mukoko.com`,
        displayName: email ? email.split('@')[0] : `User ${phone.slice(-4)}`,
      },
      update: { lastActive: new Date() },
    })

    return res.status(200).json({
      session_token: response.session_token,
      session_jwt: response.session_jwt,
      user: {
        user_id: stytchUserId,
        email,
        phone_number: phone,
        name: response.user.name,
        created_at: response.user.created_at,
        status: response.user.status,
      },
      expires_at: response.session?.expires_at,
    })
  } catch (error: any) {
    return res.status(401).json({ error: error.error_message || 'Invalid or expired code' })
  }
}
