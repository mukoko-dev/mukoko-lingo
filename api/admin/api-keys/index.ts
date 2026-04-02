/**
 * Organization API Key Management
 *
 * Allows org admins to self-service create and manage API keys
 * for programmatic access to the Lingo platform.
 *
 * Roles: admin (platform) or org_admin (organization-level)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import supabase from '../../_lib/supabase'
import crypto from 'crypto'

function generateApiKey(): string {
  const prefix = 'mk_live_'
  const secret = crypto.randomBytes(32).toString('hex')
  return `${prefix}${secret}`
}

function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAuth(req)

    // Verify org admin or platform admin
    if (user.role !== 'admin') {
      // Check if user is an org admin (teacher role in any class with an org)
      const { data: memberships } = await supabase
        .from('class_membership')
        .select('class:class(organization_id)')
        .eq('person_id', user.personId)
        .eq('role', 'teacher')
        .limit(1)

      if (!memberships || memberships.length === 0) {
        return res.status(403).json({ error: 'Org admin or platform admin role required' })
      }
    }

    if (req.method === 'GET') {
      // List API keys (show only masked versions)
      const { data: keys, error } = await supabase
        .from('api_key')
        .select('id, name, organization_id, key_prefix, scopes, last_used_at, created_at, expires_at, is_active')
        .eq('created_by', user.personId)
        .order('created_at', { ascending: false })

      if (error) throw new Error(error.message)
      return res.status(200).json({ data: keys })
    }

    if (req.method === 'POST') {
      const { name, organization_id, scopes, expires_in_days } = req.body || {}
      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' })
      }

      const plainKey = generateApiKey()
      const hashedKey = hashApiKey(plainKey)
      const keyPrefix = plainKey.substring(0, 12) + '...'

      const expiresAt = expires_in_days
        ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000).toISOString()
        : null

      const { data: apiKey, error } = await supabase
        .from('api_key')
        .insert({
          name,
          organization_id,
          key_hash: hashedKey,
          key_prefix: keyPrefix,
          scopes: scopes || ['read'],
          created_by: user.personId,
          expires_at: expiresAt,
          is_active: true,
        })
        .select('id, name, organization_id, key_prefix, scopes, created_at, expires_at')
        .single()

      if (error) throw new Error(error.message)

      // Return the plain key only once — it's stored hashed
      return res.status(201).json({
        data: {
          ...apiKey,
          key: plainKey,
        },
        warning: 'Save this API key — it will not be shown again.',
      })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
