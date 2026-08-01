/**
 * Organization API Key Management
 *
 * Allows org admins to self-service create and manage API keys
 * for programmatic access to the Lingo platform.
 *
 * Backed by the shared, ecosystem-wide `platform.apiKeys` collection —
 * not a Lingo-local table. Every key Lingo issues is `keyType: 'external'`
 * with `surfaceContext: 'lingo'`, owned by an `entity.entities` org
 * (`ownerEntityId`).
 *
 * Restricted to platform admins. There is no ecosystem-wide concept yet of
 * an "org admin" who administers a specific `entity.entities` org (a
 * `classMemberships` teacher role is scoped to a class, not an org, and
 * carries no relationship to `ownerEntityId`) — so anything short of a full
 * platform-admin check here would let any authenticated user with some
 * unrelated role mint a live API key attributed to an arbitrary org.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../../_lib/cors'
import { requireAdmin } from '../../_lib/auth-middleware'
import { platformApiKeys, getDb } from '../../_lib/mongo'
import { buildApiKeyDoc, toApiKeySummaries } from '../../../lib/db/api-key-shape'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return

  try {
    const user = await requireAdmin(req)

    const col = await platformApiKeys()

    if (req.method === 'GET') {
      const keys = await col
        .find({ createdByPersonId: user.personId, surfaceContext: 'lingo' })
        .sort({ createdAt: -1 })
        .toArray()

      return res.status(200).json({ data: toApiKeySummaries(keys) })
    }

    if (req.method === 'POST') {
      const { name, organization_id: ownerEntityId, scopes, expires_in_days: expiresInDays } = req.body || {}
      if (!name || !ownerEntityId) {
        return res.status(400).json({ error: 'name and organization_id are required' })
      }

      // organization_id must reference a real entity.entities document.
      // Caller-org membership isn't checked because the caller is already
      // a platform admin (requireAdmin above) — trusted to issue keys for
      // any org, same as every other api/admin/** route.
      const entitiesCol = (await getDb('entity')).collection('entities')
      const entity = await entitiesCol.findOne({ _id: ownerEntityId })
      if (!entity) {
        return res.status(400).json({ error: 'organization_id does not reference a known entity' })
      }

      const { doc, plainKey } = buildApiKeyDoc({
        name,
        ownerEntityId,
        createdByPersonId: user.personId,
        scopes,
        expiresInDays,
      })

      await col.insertOne(doc as any)

      // Return the plain key only once — it's stored hashed
      return res.status(201).json({
        data: {
          id: doc._id,
          name: doc.name,
          organization_id: doc.ownerEntityId,
          key_prefix: doc.keyPrefix,
          scopes: doc.scopes,
          created_at: doc.createdAt.toISOString(),
          expires_at: doc.expiresAt ? doc.expiresAt.toISOString() : null,
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
