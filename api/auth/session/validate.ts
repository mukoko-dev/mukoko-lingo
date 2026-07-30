import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { authenticateRequest } from '../../_lib/auth-middleware'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { access_token } = req.body || {}
  if (!access_token) {
    return res.status(400).json({ error: 'access_token is required' })
  }

  const fakeReq = { headers: { authorization: `Bearer ${access_token}` } } as VercelRequest
  const user = await authenticateRequest(fakeReq)
  if (!user) {
    return res.status(401).json({ error: 'Session expired or invalid' })
  }

  return res.status(200).json({
    user: { user_id: user.workosUserId, email: user.email, role: user.role },
  })
}
