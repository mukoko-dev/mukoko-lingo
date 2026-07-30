/**
 * Categories API — returns distinct categories with phrase counts.
 * Source of truth: the `category` field on the `phrases` MongoDB collection.
 *
 * GET /api/categories
 * Returns: [{ id, name, count }]
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleCors } from '../_lib/cors'
import { createLogger } from '../_lib/logger'
import { phrases } from '../_lib/mongo'

const log = createLogger('categories')

// Display metadata for known categories. Unknown categories fall back to
// title-casing the slug and using a default icon.
const CATEGORY_META: Record<string, { name: string; icon: string; description: string }> = {
  greetings: { name: 'Greetings', icon: '👋', description: 'Basic greetings and salutations' },
  family: { name: 'Family', icon: '👨‍👩‍👧‍👦', description: 'Family relationships and members' },
  shopping: { name: 'Shopping', icon: '🛍️', description: 'Shopping and bargaining phrases' },
  food: { name: 'Food', icon: '🍽️', description: 'Food, dining and meals' },
  directions: { name: 'Directions', icon: '🧭', description: 'Asking for and giving directions' },
  work: { name: 'Work', icon: '💼', description: 'Professional and work phrases' },
  home: { name: 'Home', icon: '🏠', description: 'Home and household phrases' },
  social: { name: 'Social', icon: '🤝', description: 'Social interaction phrases' },
  health: { name: 'Health', icon: '🏥', description: 'Health and medical phrases' },
  transport: { name: 'Transport', icon: '🚗', description: 'Transportation and travel' },
  emotions: { name: 'Emotions', icon: '💭', description: 'Expressing feelings and emotions' },
  school: { name: 'School', icon: '🎓', description: 'Education and learning phrases' },
  money: { name: 'Money', icon: '💰', description: 'Money and financial phrases' },
  weather: { name: 'Weather', icon: '🌤️', description: 'Weather and climate phrases' },
}

function titleCase(slug: string): string {
  return slug.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleCors(req, res)) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const col = await phrases()
    const rows = await col.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]).toArray()

    const counts: Record<string, number> = {}
    for (const row of rows) {
      if (!row._id) continue
      counts[row._id] = row.count
    }

    const categories = Object.entries(counts)
      .map(([id, count]) => {
        const meta = CATEGORY_META[id] || {
          name: titleCase(id),
          icon: '📚',
          description: `${titleCase(id)} phrases`,
        }
        return { id, name: meta.name, icon: meta.icon, description: meta.description, count }
      })
      .sort((a, b) => b.count - a.count)

    return res.status(200).json({ data: categories, count: categories.length })
  } catch (error: any) {
    log.error('Failed to fetch categories', error.message)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
