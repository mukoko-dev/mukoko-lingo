/**
 * One-time (idempotent) index creation for the MongoDB collections.
 * Run manually per environment: `npx tsx scripts/create-indexes.ts`
 * Requires MONGODB_URI to be set in the environment.
 */

import { getDb } from '../lib/db/mongo'

async function main() {
  const db = await getDb()

  await db.collection('profiles').createIndex({ workos_user_id: 1 }, { unique: true })
  await db.collection('phrase_progress').createIndex({ user_id: 1, phrase_id: 1 }, { unique: true })
  await db.collection('srs_cards').createIndex({ user_id: 1, phrase_id: 1 }, { unique: true })
  await db.collection('user_xp').createIndex({ user_id: 1 }, { unique: true })
  await db.collection('bookmarks').createIndex({ user_id: 1, phrase_id: 1 }, { unique: true })
  await db.collection('user_skills').createIndex({ user_id: 1, skill_id: 1 }, { unique: true })
  await db.collection('assignment_submissions').createIndex({ assignment_id: 1, person_id: 1 }, { unique: true })
  await db.collection('class_memberships').createIndex({ class_id: 1, person_id: 1 }, { unique: true })
  await db.collection('class_memberships').createIndex({ person_id: 1 })
  await db.collection('phrase_views').createIndex({ phrase_id: 1 })
  await db.collection('xp_events').createIndex({ user_id: 1, event_date: 1 })
  await db.collection('study_sessions').createIndex({ user_id: 1, session_date: 1 })
  await db.collection('phrases').createIndex({ category: 1 })
  await db.collection('phrases').createIndex({ skill_id: 1 })

  console.log('Indexes created.')
  process.exit(0)
}

main().catch((error) => {
  console.error('Failed to create indexes:', error)
  process.exit(1)
})
