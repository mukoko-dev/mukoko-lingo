/**
 * Content Stats Service
 *
 * Fetches counts in this priority order:
 *
 *   1. `/api/stats` Vercel serverless function (server-side, Mongo-backed)
 *   2. Bundled static data (offline fallback, local-first principle)
 */

import { phrases as staticPhrases } from '@/lib/data/phrases-data'
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

interface StatsResponse {
  total_phrases: number
  total_categories: number
  total_languages: number
}

/**
 * Try the `/api/stats` Vercel serverless endpoint. Returns null when
 * unreachable. On web the URL is relative (`/api/stats`); on native it
 * requires EXPO_PUBLIC_API_BASE_URL to be set.
 */
async function fetchFromApi(): Promise<StatsResponse | null> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || ''
  try {
    const response = await fetch(`${apiBase}/api/stats`, { method: 'GET' })
    if (!response.ok) return null
    return (await response.json()) as StatsResponse
  } catch {
    return null
  }
}

/**
 * Get aggregate content stats for landing pages and dashboards.
 *
 * Priority order: `/api/stats` → bundled static data (offline fallback).
 */
export async function getContentStats(): Promise<ContentStats> {
  const api = await fetchFromApi()
  if (api && api.total_phrases > 0) {
    return {
      totalPhrases: api.total_phrases,
      totalCategories: api.total_categories,
      totalLanguages: api.total_languages || LEARNING_LANGUAGES.length,
      fromLive: true,
    }
  }

  return staticFallback()
}

/**
 * Get categories with phrase counts. There is no dedicated categories
 * endpoint used here (the mobile app calls `/api/categories` directly via
 * `categoriesApi`) — this is the landing-page fallback path only.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  return staticCategoryFallback()
}
