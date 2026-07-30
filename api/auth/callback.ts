import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { workos, WORKOS_CLIENT_ID } from '../_lib/auth-middleware'
import { supabaseIdentity } from '../_lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { code, code_verifier } = req.body || {}
  if (!code || !code_verifier) {
    return res.status(400).json({ error: 'code and code_verifier are required' })
  }

  try {
    const { user, accessToken, refreshToken } = await workos.userManagement.authenticateWithCode({
      clientId: WORKOS_CLIENT_ID,
      code,
      codeVerifier: code_verifier,
    })

    // Upsert person in identity.person
    const { data: existing } = await supabaseIdentity
      .from('person')
      .select('id')
      .eq('email', user.email)
      .single()

    if (existing) {
      await supabaseIdentity.from('person').update({ last_active: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabaseIdentity.from('person').insert({
        email: user.email,
        display_name: user.firstName || user.email.split('@')[0],
        role: 'user',
        status: 'active',
      })
    }

    return res.status(200).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      user: {
        user_id: user.id,
        email: user.email,
        name: user.firstName ? { first_name: user.firstName, last_name: user.lastName } : undefined,
        created_at: user.createdAt,
      },
    })
  } catch (error: any) {
    console.error('[mukoko][auth] Code exchange failed:', error.error_message || error.message)
    if (error.error_type === 'configuration_error') {
      return res.status(500).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    return res.status(401).json({ error: 'Invalid or expired sign-in code' })
  }
}
