import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { stytchClient } from '../../_lib/auth-middleware'
import { supabaseIdentity } from '../../_lib/supabase'
import { SESSION_DURATION_MINUTES } from '../../../lib/stytch/config'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { method_id, code } = req.body || {}
  if (!method_id || !code) {
    return res.status(400).json({ error: 'method_id and code are required' })
  }

  try {
    const response = await stytchClient.otps.authenticate({
      method_id,
      code,
      session_duration_minutes: SESSION_DURATION_MINUTES,
    })

    const stytchUserId = response.user.user_id
    const userEmail = response.user.emails?.[0]?.email || ''

    // Upsert person in identity.person
    const { data: existing } = await supabaseIdentity
      .from('person')
      .select('id')
      .eq('email', userEmail)
      .single()

    if (existing) {
      await supabaseIdentity.from('person').update({ last_active: new Date().toISOString() }).eq('id', existing.id)
    } else {
      await supabaseIdentity.from('person').insert({
        email: userEmail,
        display_name: userEmail.split('@')[0],
        role: 'user',
        status: 'active',
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
        status: response.user.status,
      },
      expires_at: response.session?.expires_at,
    })
  } catch (error: any) {
    console.error('[mukoko][auth] OTP verify failed:', error.error_message || error.message)
    if (error.error_type === 'configuration_error') {
      return res.status(500).json({ error: 'Authentication service is temporarily unavailable.' })
    }
    return res.status(error.status_code || 401).json({ error: error.error_message || 'Invalid or expired code' })
  }
}
