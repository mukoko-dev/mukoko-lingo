/**
 * Content Stats Service
 *
 * Fetches counts from Supabase in this priority order:
 *
 *   1. `content-stats` Supabase Edge Function (cached, cheap, fast)
 *   2. `/api/stats` Vercel serverless function (server-side, no client env vars needed)
 *   3. Direct PostgREST queries via `supabasePublic.schema('lingo')`
 *   4. Bundled static data (offline fallback, local-first principle)
 *
 * The `/api/stats` step ensures the landing page always shows live DB
 * counts even when the Supabase EXPO_PUBLIC_ env vars aren't baked into
 * the web bundle at build time.
 */

import { supabasePublic, isSupabasePublicConfigured } from '@/lib/db/supabase-client'
import { phrases as staticPhrases, categories as staticCategories } from '@/lib/data/phrases-data'
import { LEARNING_LANGUAGES } from '@/lib/hooks/useLearningLanguage'

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''

const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''

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

interface EdgeStatsResponse {
  total_phrases: number
  total_categories: number
  total_languages: number
  categories?: Array<{ id: string; name: string; icon: string; description: string; count: number }>
}

/**
 * Try the `content-stats` Supabase Edge Function first. Returns null
 * when the function isn't reachable or Supabase isn't configured.
 */
async function fetchFromEdge(): Promise<EdgeStatsResponse | null> {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/content-stats`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
    })
    if (!response.ok) return null
    return (await response.json()) as EdgeStatsResponse
  } catch {
    return null
  }
}

/**
 * Try the public `/api/stats` Vercel serverless endpoint. Runs server-side
 * so it uses SUPABASE_URL (not an EXPO_PUBLIC_ var) and always has DB access.
 * On web the URL is relative (`/api/stats`); on native it requires
 * EXPO_PUBLIC_API_BASE_URL to be set.
 */
async function fetchFromApi(): Promise<EdgeStatsResponse | null> {
  const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || ''
  try {
    const response = await fetch(`${apiBase}/api/stats`, { method: 'GET' })
    if (!response.ok) return null
    return (await response.json()) as EdgeStatsResponse
  } catch {
    return null
  }
}

/**
 * Get aggregate content stats for landing pages and dashboards.
 *
 * Priority order:
 *   1. `content-stats` Supabase Edge Function
 *   2. `/api/stats` Vercel serverless (server-side DB access, no build-time env vars)
 *   3. Direct PostgREST via `supabasePublic.schema('lingo')`
 *   4. Bundled static data (offline fallback)
 */
export async function getContentStats(): Promise<ContentStats> {
  // 1. Edge function (fastest, pre-aggregated server-side)
  const edge = await fetchFromEdge()
  if (edge && edge.total_phrases > 0) {
    return {
      totalPhrases: edge.total_phrases,
      totalCategories: edge.total_categories,
      totalLanguages: edge.total_languages || LEARNING_LANGUAGES.length,
      fromLive: true,
    }
  }

  // 2. Vercel serverless — server-side DB access, works without EXPO_PUBLIC_ vars
  const api = await fetchFromApi()
  if (api && api.total_phrases > 0) {
    return {
      totalPhrases: api.total_phrases,
      totalCategories: api.total_categories,
      totalLanguages: api.total_languages || LEARNING_LANGUAGES.length,
      fromLive: true,
    }
  }

  // 3. Direct PostgREST
  if (!isSupabasePublicConfigured()) {
    return staticFallback()
  }

  try {
    const lingo = supabasePublic.schema('lingo' as any)
    const [phraseResult, categoryResult, languageResult] = await Promise.all([
      lingo.from('phrase').select('id', { count: 'exact', head: true }),
      lingo.from('phrase').select('category'),
      lingo.from('translation').select('language_id'),
    ])

    if (phraseResult.error) throw phraseResult.error

    const categorySet = new Set<string>()
    for (const row of (categoryResult.data || []) as Array<{ category: string | null }>) {
      if (row.category) categorySet.add(row.category)
    }

    const languageSet = new Set<string>()
    for (const row of (languageResult.data || []) as Array<{ language_id: string | null }>) {
      if (row.language_id) languageSet.add(row.language_id)
    }

    const totalPhrases = phraseResult.count || 0

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
 *
 * Priority: edge function → direct PostgREST → bundled fallback.
 */
export async function getCategoriesWithCounts(): Promise<CategoryWithCount[]> {
  // 1. Edge function already returns categories with metadata baked in
  const edge = await fetchFromEdge()
  if (edge?.categories && edge.categories.length > 0) {
    return edge.categories.map(c => ({ ...c, fromLive: true }))
  }

  // 2. Direct PostgREST
  if (!isSupabasePublicConfigured()) {
    return staticCategoryFallback()
  }

  try {
    const { data, error } = await supabasePublic
      .schema('lingo' as any)
      .from('phrase')
      .select('category')
    if (error) throw error

    const counts: Record<string, number> = {}
    for (const row of (data || []) as Array<{ category: string | null }>) {
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
