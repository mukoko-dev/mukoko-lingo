/**
 * OneRoster v1.1 Roster Sync Endpoint
 *
 * Pulls org/class/user/enrollment data from a school's OneRoster-compliant
 * roster server and syncs it into the lingo schema.
 *
 * Flow:
 *   1. Admin provides OneRoster server URL + OAuth2 client credentials
 *   2. We authenticate with the roster server (client_credentials grant)
 *   3. Pull orgs → classes → users → enrollments
 *   4. Upsert into lingo.class, lingo.class_membership, identity.person
 *
 * Supports: Clever, ClassLink, PowerSchool, Infinite Campus, and any
 * IMS OneRoster v1.1 compliant server.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { requireAdmin } from '../_lib/auth-middleware'
import supabase, { supabaseIdentity } from '../_lib/supabase'

const ONEROSTER_ROLE_MAP: Record<string, string> = {
  teacher: 'teacher',
  student: 'student',
  aide: 'ta',
  administrator: 'teacher',
}

interface OneRosterToken {
  access_token: string
  token_type: string
  expires_in: number
}

/**
 * Get OAuth2 access token from OneRoster server
 */
async function getOneRosterToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string
): Promise<OneRosterToken> {
  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'roster-core.readonly',
    }),
  })

  if (!response.ok) {
    throw new Error(`OneRoster auth failed: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Fetch paginated data from a OneRoster endpoint
 */
async function fetchOneRoster<T>(
  baseUrl: string,
  path: string,
  token: string,
  limit: number = 100
): Promise<T[]> {
  const results: T[] = []
  let offset = 0

  while (true) {
    const url = `${baseUrl}${path}?limit=${limit}&offset=${offset}`
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) break
      throw new Error(`OneRoster fetch ${path} failed: ${response.status}`)
    }

    const data = await response.json()
    // OneRoster wraps results in a key matching the resource name
    const key = Object.keys(data).find(k => Array.isArray(data[k]))
    if (!key || data[key].length === 0) break

    results.push(...data[key])
    if (data[key].length < limit) break
    offset += limit
  }

  return results
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    await requireAdmin(req)

    const {
      oneroster_base_url,
      oneroster_token_url,
      client_id,
      client_secret,
      organization_id,
    } = req.body || {}

    if (!oneroster_base_url || !client_id || !client_secret || !organization_id) {
      return res.status(400).json({
        error: 'oneroster_base_url, client_id, client_secret, and organization_id are required',
      })
    }

    const baseUrl = oneroster_base_url.replace(/\/$/, '')
    const tokenUrl = oneroster_token_url || `${baseUrl}/token`

    // Step 1: Authenticate with the roster server
    const tokenData = await getOneRosterToken(tokenUrl, client_id, client_secret)

    // Step 2: Fetch classes from the roster server
    const rosterClasses = await fetchOneRoster<any>(
      baseUrl,
      '/ims/oneroster/v1p1/classes',
      tokenData.access_token
    )

    // Step 3: Fetch enrollments
    const rosterEnrollments = await fetchOneRoster<any>(
      baseUrl,
      '/ims/oneroster/v1p1/enrollments',
      tokenData.access_token
    )

    // Step 4: Fetch users
    const rosterUsers = await fetchOneRoster<any>(
      baseUrl,
      '/ims/oneroster/v1p1/users',
      tokenData.access_token
    )

    const stats = { classes_synced: 0, users_synced: 0, enrollments_synced: 0 }

    // Step 5: Upsert users into identity.person
    const userIdMap = new Map<string, string>() // oneroster sourcedId → person.id
    for (const u of rosterUsers) {
      const email = u.email || `${u.username || u.sourcedId}@oneroster.local`
      const { data: existing } = await supabaseIdentity
        .from('person')
        .select('id')
        .eq('email', email)
        .single()

      if (existing) {
        userIdMap.set(u.sourcedId, existing.id)
      } else {
        const { data: created } = await supabaseIdentity
          .from('person')
          .insert({
            email,
            display_name: `${u.givenName || ''} ${u.familyName || ''}`.trim() || email.split('@')[0],
            role: 'user',
            status: 'active',
          })
          .select('id')
          .single()
        if (created) {
          userIdMap.set(u.sourcedId, created.id)
          stats.users_synced++
        }
      }
    }

    // Step 6: Upsert classes
    const classIdMap = new Map<string, string>() // oneroster sourcedId → class.id
    for (const c of rosterClasses) {
      const { data: existing } = await supabase
        .from('class')
        .select('id')
        .eq('oneroster_sourced_id', c.sourcedId)
        .single()

      if (existing) {
        classIdMap.set(c.sourcedId, existing.id)
      } else {
        const { data: created } = await supabase
          .from('class')
          .insert({
            name: c.title || c.sourcedId,
            description: c.classType || null,
            organization_id,
            oneroster_sourced_id: c.sourcedId,
          })
          .select('id')
          .single()
        if (created) {
          classIdMap.set(c.sourcedId, created.id)
          stats.classes_synced++
        }
      }
    }

    // Step 7: Upsert enrollments
    for (const e of rosterEnrollments) {
      const classId = classIdMap.get(e.class?.sourcedId)
      const personId = userIdMap.get(e.user?.sourcedId)
      if (!classId || !personId) continue

      const role = ONEROSTER_ROLE_MAP[e.role?.toLowerCase()] || 'student'

      const { data: existing } = await supabase
        .from('class_membership')
        .select('id')
        .eq('class_id', classId)
        .eq('person_id', personId)
        .single()

      if (!existing) {
        await supabase.from('class_membership').insert({
          class_id: classId,
          person_id: personId,
          role,
        })
        stats.enrollments_synced++
      }
    }

    return res.status(200).json({
      data: {
        ...stats,
        total_roster_classes: rosterClasses.length,
        total_roster_users: rosterUsers.length,
        total_roster_enrollments: rosterEnrollments.length,
      },
    })
  } catch (error: any) {
    if (error.message === 'Unauthorized') return res.status(401).json({ error: 'Unauthorized' })
    if (error.message === 'Forbidden') return res.status(403).json({ error: 'Forbidden' })
    return res.status(500).json({ error: error.message || 'OneRoster sync failed' })
  }
}
