/**
 * API Client for Mukoko Lingo
 * Handles all data operations via REST API backed by Supabase PostgreSQL.
 * Queries the normalized lingo.* / identity.* / system.* schemas.
 *
 * All requests include the WorkOS access token for authentication.
 */

import { getSessionToken } from '@/lib/auth/workos-client'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || ''

// =============================================================================
// Core HTTP Client with Exponential Backoff Retry
// =============================================================================

interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // exponential backoff: 1s, 2s, 4s
const REQUEST_TIMEOUT_MS = 15000 // 15 second timeout per request

// ---------------------------------------------------------------------------
// Offline-mode guard
// ---------------------------------------------------------------------------

const OFFLINE_MODE_KEY = '@mukoko_offline_mode'

/**
 * Quick synchronous-ish check for offline mode. Reads from AsyncStorage.
 * Returns true when the user has explicitly opted in to offline mode.
 */
async function checkOfflineMode(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(OFFLINE_MODE_KEY)
    return value === 'true'
  } catch {
    return false
  }
}

/**
 * When offline mode is active, write-operations (POST/PUT/DELETE) are
 * silently skipped and return a sentinel response. GET operations also
 * return null so callers fall back to local data.
 */
function offlineResponse<T>(method: string): ApiResponse<T> {
  return {
    data: null,
    error: `Offline mode is active — ${method} request skipped`,
  }
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * Determine if a failed request should be retried.
 * Retries on network errors and 5xx server errors, not on 4xx client errors.
 */
function shouldRetry(error: any, response?: Response): boolean {
  if (!response) return true // network error
  return response.status >= 500 && response.status < 600
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: any
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
      const response = await fetch(url, { ...options, signal: controller.signal })
      clearTimeout(timer)
      if (response.ok || !shouldRetry(null, response) || attempt === retries) {
        return response
      }
      // Server error — retry after delay
      await delay(RETRY_DELAYS[attempt] || 4000)
    } catch (error) {
      lastError = error
      if (attempt < retries) {
        await delay(RETRY_DELAYS[attempt] || 4000)
      }
    }
  }
  throw lastError || new Error('Request failed after retries')
}

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<ApiResponse<T>> {
  try {
    if (await checkOfflineMode()) return offlineResponse<T>('GET')

    const headers = await getAuthHeaders()
    const url = new URL(`${API_BASE_URL}/api${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
    }

    const response = await fetchWithRetry(url.toString(), { method: 'GET', headers })
    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data.error || `Request failed: ${response.status}` }
    }

    return { data: data.data ?? data, error: null, count: data.count }
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' }
  }
}

async function apiPost<T>(path: string, body: Record<string, any>): Promise<ApiResponse<T>> {
  try {
    if (await checkOfflineMode()) {
      // Queue the write for later sync
      const { enqueueSyncOperation } = await import('./offline')
      await enqueueSyncOperation('POST', path, body)
      return offlineResponse<T>('POST')
    }

    const headers = await getAuthHeaders()
    const response = await fetchWithRetry(`${API_BASE_URL}/api${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })
    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data.error || `Request failed: ${response.status}` }
    }

    return { data: data.data ?? data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' }
  }
}

async function apiPut<T>(path: string, body: Record<string, any>): Promise<ApiResponse<T>> {
  try {
    if (await checkOfflineMode()) {
      const { enqueueSyncOperation } = await import('./offline')
      await enqueueSyncOperation('PUT', path, body)
      return offlineResponse<T>('PUT')
    }

    const headers = await getAuthHeaders()
    const response = await fetchWithRetry(`${API_BASE_URL}/api${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    })
    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data.error || `Request failed: ${response.status}` }
    }

    return { data: data.data ?? data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' }
  }
}

async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  try {
    if (await checkOfflineMode()) {
      const { enqueueSyncOperation } = await import('./offline')
      await enqueueSyncOperation('DELETE', path)
      return offlineResponse<T>('DELETE')
    }

    const headers = await getAuthHeaders()
    const response = await fetchWithRetry(`${API_BASE_URL}/api${path}`, {
      method: 'DELETE',
      headers,
    })
    const data = await response.json()

    if (!response.ok) {
      return { data: null, error: data.error || `Request failed: ${response.status}` }
    }

    return { data: data.data ?? data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message || 'Network error' }
  }
}

// =============================================================================
// Profile Operations
// =============================================================================

export const profilesApi = {
  /** Get current user's profile */
  getMyProfile: () => apiGet<any>('/profiles/me'),

  /** Update own profile */
  updateMyProfile: (data: Record<string, any>) =>
    apiPut<any>('/profiles/me', data),
}

// =============================================================================
// Phrase Operations
// =============================================================================

export interface PhraseStats {
  total_phrases: number
  total_categories: number
  total_languages: number
}

export interface CategoryWithCount {
  id: string
  name: string
  icon: string
  description: string
  count: number
}

export const phrasesApi = {
  /** List phrases with optional filters */
  listPhrases: (params?: { category?: string; difficulty?: string; skill_id?: string }) =>
    apiGet<any[]>('/phrases', params as Record<string, string>),

  /** Get single phrase */
  getPhrase: (id: string) => apiGet<any>(`/phrases/${id}`),

  /** Get aggregate phrase stats for landing pages */
  getStats: () => apiGet<PhraseStats>('/phrases/stats'),
}

export const categoriesApi = {
  /** List all categories with phrase counts, sourced from the database */
  listCategories: () => apiGet<CategoryWithCount[]>('/categories'),
}

// =============================================================================
// Bookmark Operations
// =============================================================================

export const bookmarksApi = {
  /** List user bookmarks */
  listBookmarks: () => apiGet<any[]>('/bookmarks'),

  /** Add bookmark */
  addBookmark: (phraseId: string) => apiPost<any>('/bookmarks', { phrase_id: phraseId }),

  /** Remove bookmark */
  removeBookmark: (phraseId: string) => apiDelete<any>(`/bookmarks/${phraseId}`),

  /** Check if phrase is bookmarked */
  isBookmarked: (phraseId: string) => apiGet<{ bookmarked: boolean }>(`/bookmarks/${phraseId}/check`),
}

// =============================================================================
// Progress Operations
// =============================================================================

export const progressApi = {
  /** Get phrase progress */
  getProgress: () => apiGet<any[]>('/progress'),

  /** Update phrase progress */
  updateProgress: (phraseId: string, status: string) =>
    apiPost<any>('/progress', { phrase_id: phraseId, status }),

  /** Get study sessions */
  getStudySessions: () => apiGet<any[]>('/study-sessions'),

  /** Record study session */
  recordStudySession: (data: { phrases_studied: number; time_spent_minutes: number }) =>
    apiPost<any>('/study-sessions', data),
}

// =============================================================================
// Skills Operations
// =============================================================================

export const skillsApi = {
  /** List all skills */
  listSkills: () => apiGet<any[]>('/skills'),

  /** Get skill levels */
  getSkillLevels: () => apiGet<any[]>('/skills/levels'),

  /** Get user skills */
  getUserSkills: () => apiGet<any[]>('/skills/user'),
}

// =============================================================================
// Assessment Operations
// =============================================================================

export const assessmentsApi = {
  /** List assessments */
  listAssessments: (params?: { skill_id?: string; type?: string }) =>
    apiGet<any[]>('/assessments', params as Record<string, string>),

  /** Get assessment */
  getAssessment: (id: string) => apiGet<any>(`/assessments/${id}`),

  /** Submit assessment */
  submitAssessment: (data: Record<string, any>) =>
    apiPost<any>('/assessments/submit', data),

  /** Get user assessment history */
  getUserAssessments: () => apiGet<any[]>('/assessments/user'),
}

// =============================================================================
// AI Chat Operations
// =============================================================================

export const aiApi = {
  /** List conversations */
  listConversations: () => apiGet<any[]>('/ai/conversations'),

  /** Get conversation messages */
  getMessages: (conversationId: string) =>
    apiGet<any[]>(`/ai/conversations/${conversationId}/messages`),

  /** Create conversation */
  createConversation: (data: { type: string; language: string; title?: string }) =>
    apiPost<any>('/ai/conversations', data),

  /** Send message (stored server-side, AI response handled separately) */
  storeMessage: (conversationId: string, data: { role: string; content: string }) =>
    apiPost<any>(`/ai/conversations/${conversationId}/messages`, data),
}

// =============================================================================
// Class Operations (Teacher/Student)
// =============================================================================

export const classesApi = {
  /** List classes the user belongs to */
  listClasses: (params?: { organization_id?: string }) =>
    apiGet<any[]>('/classes', params as Record<string, string>),

  /** Get class details with members and assignments */
  getClass: (id: string) => apiGet<any>(`/classes/${id}`),

  /** Create a new class */
  createClass: (data: { name: string; organization_id: string; description?: string; language_id?: string }) =>
    apiPost<any>('/classes', data),

  /** Update class details (teacher only) */
  updateClass: (id: string, data: Record<string, any>) => apiPut<any>(`/classes/${id}`, data),

  /** Delete class (teacher only) */
  deleteClass: (id: string) => apiDelete<any>(`/classes/${id}`),

  /** List class members */
  getMembers: (classId: string) => apiGet<any[]>(`/classes/${classId}/members`),

  /** Add a member to a class */
  addMember: (classId: string, data: { person_id?: string; email?: string; role?: string }) =>
    apiPost<any>(`/classes/${classId}/members`, data),
}

// =============================================================================
// Assignment Operations
// =============================================================================

export const assignmentsApi = {
  /** List assignments for a class */
  listAssignments: (classId: string) =>
    apiGet<any[]>('/assignments', { class_id: classId }),

  /** Get assignment details with submissions */
  getAssignment: (id: string) => apiGet<any>(`/assignments/${id}`),

  /** Create assignment (teacher only) */
  createAssignment: (data: { class_id: string; title: string; description?: string; phrase_ids?: string[]; due_date?: string }) =>
    apiPost<any>('/assignments', data),

  /** Update assignment (teacher only) */
  updateAssignment: (id: string, data: Record<string, any>) => apiPut<any>(`/assignments/${id}`, data),

  /** Delete assignment (teacher only) */
  deleteAssignment: (id: string) => apiDelete<any>(`/assignments/${id}`),

  /** Submit assignment (student) */
  submitAssignment: (id: string, data: { answers?: any; score?: number; time_taken?: number }) =>
    apiPost<any>(`/assignments/${id}/submit`, data),
}

// =============================================================================
// Admin Phrase Operations
// =============================================================================

export const adminPhrasesApi = {
  /** Create a new phrase (admin only) */
  createPhrase: (data: Record<string, any>) =>
    apiPost<any>('/admin/phrases', data),

  /** Update an existing phrase (admin only) */
  updatePhrase: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/phrases/${id}`, data),

  /** Delete a phrase (admin only) */
  deletePhrase: (id: string) =>
    apiDelete<any>(`/admin/phrases/${id}`),
}

// =============================================================================
// Community Leaderboard
// =============================================================================

export interface LeaderboardEntry {
  rank: number
  displayName: string
  weeklyXP: number
  phrasesStudied: number
  isCurrentUser: boolean
}

export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[]
  currentUserRank: { rank: number; weeklyXP: number } | null
  period: string
  totalParticipants: number
}

export const leaderboardApi = {
  /** Get weekly XP leaderboard */
  getWeekly: (limit = 20) =>
    apiGet<LeaderboardResponse>('/leaderboard', { limit: String(limit) }),
}

// NOTE: Admin operations (stats, standards, moderation, guardrails, analytics,
// enrollment, OneRoster sync, API keys) live in the Next.js web app.
// The API routes on Vercel are shared — the web app calls the same endpoints.
