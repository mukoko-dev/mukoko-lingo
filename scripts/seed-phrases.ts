/**
 * One-time seed of the `phrases` MongoDB collection from the bundled
 * static phrase content. Skips if the collection is already non-empty.
 * Run manually per environment: `npx tsx scripts/seed-phrases.ts`
 */

import { phrases as staticPhrases } from '../lib/data/phrases-data'
import { getDb } from '../lib/db/mongo'

async function main() {
  const db = await getDb()
  const col = db.collection('phrases')

  const existing = await col.countDocuments()
  if (existing > 0) {
    console.log(`phrases collection already has ${existing} docs — skipping seed`)
    process.exit(0)
  }

  const docs = staticPhrases.map((p) => ({
    category: p.category,
    english: p.english,
    shona: p.shona,
    ndebele: p.ndebele,
    swahili: p.swahili,
    chinese: p.chinese,
    pronunciation: p.pronunciation,
    context: p.context,
    created_at: new Date(),
  }))

  await col.insertMany(docs)
  console.log(`Seeded ${docs.length} phrases.`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Failed to seed phrases:', error)
  process.exit(1)
})
