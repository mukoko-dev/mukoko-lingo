import type { VercelRequest, VercelResponse } from '@vercel/node'
import { decodeJwt } from 'jose'
import { handleCors } from '../_lib/cors'
import { workos } from '../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { access_token } = req.body || {}

  try {
    if (access_token) {
      const { sid } = decodeJwt(access_token) as { sid?: string }
      if (sid) await workos.userManagement.revokeSession({ sessionId: sid })
    }
  } catch {
    // Even if revocation fails, consider it a success — client-side clearing is authoritative
  }

  return res.status(200).json({ success: true })
}
