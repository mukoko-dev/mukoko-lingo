/**
 * Content Stats Service
 *
 * Queries Supabase data API directly from the client (PostgREST).
 * No Vercel serverless function in between — keeps the app light.
 *
 * Falls back to bundled static data when offline or Supabase
 * is unreachable, honoring the local-first architecture principle.
 */

import { supabasePublic, isSupabasePublicConfigured } from '@/lib/db/supabase-client'
import { phrases as staticPhrases, categories as staticCategories } from '@/lib/data/phrases-data'
import { LEARNING_LANGUAGES } from '@/lib/hooks/useLearningLanguage'

export interface ContentStats {
  totalPhrases: number
  totalCategories: number
  totalLanguages: number
  /** True when counts came from the live database, false when using bundled fallback. */
  fromLive: boolean
}

export interface CategoryWithCount {
  id: string
  name: string
  icon: string
  description: string
  count: number
  fromLive: boolean
}

// Display metadata for known categories. Unknown slugs get title-cased.
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

function staticFallback(): ContentStats {
  const categorySet = new Set(staticPhrases.map(p => p.category))
  return {
    totalPhrases: staticPhrases.length,
    totalCategories: categorySet.size,
    totalLanguages: LEARNING_LANGUAGES.length,
    fromLive: false,
  }
}

function staticCategoryFallback(): CategoryWithCount[] {
  const counts: Record<string, number> = {}
  for (const phrase of staticPhrases) {
    counts[phrase.category] = (counts[phrase.category] || 0) + 1
  }
  return Object.entries(counts)
    .map(([id, count]) => {
      const meta = CATEGORY_META[id] || {
        name: titleCase(id),
        icon: '📚',
        description: `${titleCase(id)} phrases`,
      }
      return { id, name: meta.name, icon: meta.icon, description: meta.description, count, fromLive: false }
    })
    .sort((a, b) => b.count - a.count)
}

/**
 * Get aggregate content stats for landing pages and dashboards.
 * Queries Supabase directly; falls back to bundled data when unreachable.
 */
export async function getContentStats(): Promise<ContentStats> {
  if (!isSupabasePublicConfigured()) {
    return staticFallback()
  }

  try {
    const [phraseResult, categoryResult, languageResult] = await Promise.all([
      supabasePublic.from('phrase').select('id', { count: 'exact', head: true }),
      supabasePublic.from('phrase').select('category'),
      supabasePublic.from('translation').select('language_id'),
    ])

    if (phraseResult.error) throw phraseResult.error

    const categorySet = new Set<string>()
    for (const row of categoryResult.data || []) {
      if (row.category) categorySet.add(row.category)
    }

    const languageSet = new Set<string>()
    for (const row of languageResult.data || []) {
      if (row.language_id) languageSet.add(row.language_id)
    }

    const totalPhrases = phraseResult.count || 0

    // If the DB is empty (no seeds yet), prefer the bundled counts so the
    // landing page doesn't show zeros to new installs.
    if (totalPhrases === 0) {
      return staticFallback()
    }

    return {
      totalPhrases,
      totalCategories: categorySet.size,
      totalLanguages: languageSet.size || LEARNING_LANGUAGES.length,
      fromLive: true,
    }
  } catch {
    return staticFallback()
  }
}

/**
 * Get categories with phrase counts from the database.
 * Falls back to bundled category counts when unreachable.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  if (!isSupabasePublicConfigured()) {
    return staticCategoryFallback()
  }

  try {
    const { data, error } = await supabasePublic.from('phrase').select('category')
    if (error) throw error

    const counts: Record<string, number> = {}
    for (const row of data || []) {
      if (row.category) counts[row.category] = (counts[row.category] || 0) + 1
    }

    if (Object.keys(counts).length === 0) {
      return staticCategoryFallback()
    }

    return Object.entries(counts)
      .map(([id, count]) => {
        const meta = CATEGORY_META[id] || {
          name: titleCase(id),
          icon: '📚',
          description: `${titleCase(id)} phrases`,
        }
        return { id, name: meta.name, icon: meta.icon, description: meta.description, count, fromLive: true }
      })
      .sort((a, b) => b.count - a.count)
  } catch {
    return staticCategoryFallback()
  }
}
