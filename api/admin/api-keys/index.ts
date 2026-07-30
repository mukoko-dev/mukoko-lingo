/**
 * Organization API Key Management
 *
 * Allows org admins to self-service create and manage API keys
 * for programmatic access to the Lingo platform.
 *
 * Roles: admin (platform) or org_admin (organization-level)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { handleCors } from '../../_lib/cors'
import { requireAuth } from '../../_lib/auth-middleware'
import { apiKeys, classMemberships } from '../../_lib/mongo'

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
      const membershipsCol = await classMemberships()
      const membership = await membershipsCol.findOne({ person_id: user.personId, role: 'teacher' })

      if (!membership) {
        return res.status(403).json({ error: 'Org admin or platform admin role required' })
      }
    }

    const col = await apiKeys()

    if (req.method === 'GET') {
      const keys = await col
        .find({ created_by: user.personId })
        .project({ name: 1, organization_id: 1, key_prefix: 1, scopes: 1, last_used_at: 1, created_at: 1, expires_at: 1, is_active: 1 })
        .sort({ created_at: -1 })
        .toArray()

      return res.status(200).json({ data: keys.map((k: any) => ({ ...k, id: String(k._id) })) })
    }

    if (req.method === 'POST') {
      const { name, organization_id, scopes, expires_in_days } = req.body || {}
      if (!name || !organization_id) {
        return res.status(400).json({ error: 'name and organization_id are required' })
      }

      const plainKey = generateApiKey()
      const hashedKey = hashApiKey(plainKey)
      const keyPrefix = plainKey.substring(0, 12) + '...'

      const expiresAt = expires_in_days ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000) : null

      const doc = {
        name,
        organization_id,
        key_hash: hashedKey,
        key_prefix: keyPrefix,
        scopes: scopes || ['read'],
        created_by: user.personId,
        expires_at: expiresAt,
        is_active: true,
        created_at: new Date(),
      }

      const result = await col.insertOne(doc as any)

      // Return the plain key only once — it's stored hashed
      return res.status(201).json({
        data: {
          id: String(result.insertedId),
          name: doc.name,
          organization_id: doc.organization_id,
          key_prefix: doc.key_prefix,
          scopes: doc.scopes,
          created_at: doc.created_at,
          expires_at: doc.expires_at,
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
