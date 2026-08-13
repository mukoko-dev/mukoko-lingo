/**
 * Seed of the `lingo.skills` collection from the bundled skill catalogue.
 *
 * Idempotent: each skill is upserted by its stable UUID `_id`, so re-running
 * refreshes the catalogue in place rather than duplicating it. Run manually
 * per environment: `npx tsx scripts/seed-skills.ts`
 *
 * Only touches the five catalogue documents. User proficiency lives in
 * `lingo.user_skills` and is never written here.
 */

import { skills as seedSkills } from '../lib/data/skills-data'
import { getDb } from '../lib/db/mongo'

async function main() {
  const db = await getDb()
  const col = db.collection('skills')

  const now = new Date()
  let upserted = 0
  let modified = 0

  for (const skill of seedSkills) {
    const { _id, ...fields } = skill
    const result = await col.updateOne(
      { _id: _id as any },
      { $set: { ...fields, updated_at: now }, $setOnInsert: { created_at: now } },
      { upsert: true }
    )
    if (result.upsertedCount) upserted++
    else if (result.modifiedCount) modified++
  }

  const total = await col.countDocuments()
  console.log(`Seeded skills: ${upserted} inserted, ${modified} updated. Collection now holds ${total}.`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Failed to seed skills:', error)
  process.exit(1)
})
