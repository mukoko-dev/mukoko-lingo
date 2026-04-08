import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { stytchClient } from '../_lib/auth-middleware'
import { supabaseIdentity } from '../_lib/supabase'
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

    // Upsert person in identity.person
    let { data: person } = await supabaseIdentity
      .from('person')
      .select('id, status')
      .eq('email', userEmail)
      .single()

    if (!person) {
      const { data: created } = await supabaseIdentity
        .from('person')
        .insert({
          email: userEmail,
          display_name: response.user.name?.first_name || userEmail.split('@')[0],
          role: 'user',
          status: 'active',
        })
        .select('id, status')
        .single()
      person = created
    } else {
      await supabaseIdentity
        .from('person')
        .update({ last_active: new Date().toISOString() })
        .eq('id', person.id)
    }

    return res.status(200).json({
      session_token: response.session_token,
      session_jwt: response.session_jwt,
      user: {
        user_id: stytchUserId,
        email: userEmail,
        name: response.user.name,
        created_at: response.user.created_at,
        status: person?.status || 'active',
      },
      expires_at: response.session?.expires_at,
    })
  } catch (error: any) {
    console.error('[mukoko][auth] Login failed:', error.error_message || error.message)
    const errorType = error.error_type || ''
    let message: string
    let status: number
    if (errorType === 'configuration_error') {
      message = 'Authentication service is temporarily unavailable.'
      status = 500
    } else if (errorType === 'unauthorized_credentials') {
      message = 'Incorrect email or password. Please try again.'
      status = 401
    } else if (errorType === 'user_not_found' || errorType.includes('not_found')) {
      message = 'No account found with this email. Please sign up first.'
      status = 401
    } else if (errorType === 'no_password_set') {
      message = 'This account uses passwordless login. Try signing in with email code or magic link instead.'
      status = 401
    } else {
      message = error.error_message || error.message || 'Login failed. Please try again.'
      status = error.status_code || 500
    }
    return res.status(status).json({ error: message })
  }
}
