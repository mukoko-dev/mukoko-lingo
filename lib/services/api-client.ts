/**
 * API Client for Mukoko Lingo
 * Handles all data operations via REST API backed by Supabase PostgreSQL.
 * Queries the normalized lingo.* / identity.* / system.* schemas.
 *
 * All requests include the Stytch session token for authentication.
 */

import { getSessionToken } from '@/lib/auth/stytch-client'

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
      const response = await fetch(url, options)
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

  /** Get a profile by ID (admin) */
  getProfile: (id: string) => apiGet<any>(`/profiles/${id}`),

  /** List all profiles (admin) */
  listProfiles: (params?: { role?: string; status?: string }) =>
    apiGet<any[]>('/profiles', params as Record<string, string>),

  /** Update a profile */
  updateProfile: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/profiles/${id}`, data),

  /** Update user role (admin) */
  updateRole: (id: string, role: string) =>
    apiPut<any>(`/admin/users/${id}/role`, { role }),

  /** Suspend/activate user (admin) */
  updateUserStatus: (id: string, status: string) =>
    apiPut<any>(`/admin/users/${id}/status`, { status }),
}

// =============================================================================
// Phrase Operations
// =============================================================================

export const phrasesApi = {
  /** List phrases with optional filters */
  listPhrases: (params?: { category?: string; difficulty?: string; skill_id?: string }) =>
    apiGet<any[]>('/phrases', params as Record<string, string>),

  /** Get single phrase */
  getPhrase: (id: string) => apiGet<any>(`/phrases/${id}`),

  /** Create phrase (admin) */
  createPhrase: (data: Record<string, any>) => apiPost<any>('/admin/phrases', data),

  /** Update phrase (admin) */
  updatePhrase: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/phrases/${id}`, data),

  /** Delete phrase (admin) */
  deletePhrase: (id: string) => apiDelete<any>(`/admin/phrases/${id}`),
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

  /** Update skill (admin) */
  updateSkill: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/skills/${id}`, data),

  /** Toggle skill active status (admin) */
  toggleSkillActive: (id: string, isActive: boolean) =>
    apiPut<any>(`/admin/skills/${id}`, { is_active: isActive }),
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
// Learning Standards Operations (Admin)
// =============================================================================

export const standardsApi = {
  /** List all standards */
  listStandards: () => apiGet<any[]>('/admin/standards'),

  /** Update standard */
  updateStandard: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/standards/${id}`, data),

  /** Toggle standard active */
  toggleStandardActive: (id: string, isActive: boolean) =>
    apiPut<any>(`/admin/standards/${id}`, { is_active: isActive }),
}

// =============================================================================
// Moderation Operations (Admin)
// =============================================================================

export const moderationApi = {
  /** List moderation alerts */
  listAlerts: (params?: { status?: string }) =>
    apiGet<any[]>('/admin/moderation', params as Record<string, string>),

  /** Update alert status */
  updateAlert: (id: string, data: { status: string; admin_notes?: string }) =>
    apiPut<any>(`/admin/moderation/${id}`, data),
}

// =============================================================================
// Guardrails Operations (Admin)
// =============================================================================

export const guardrailsApi = {
  /** List guardrails */
  listGuardrails: () => apiGet<any[]>('/admin/guardrails'),

  /** Update guardrail */
  updateGuardrail: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/guardrails/${id}`, data),

  /** Toggle guardrail active */
  toggleGuardrailActive: (id: string, isActive: boolean) =>
    apiPut<any>(`/admin/guardrails/${id}`, { is_active: isActive }),
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
// Admin Stats Operations
// =============================================================================

export const adminStatsApi = {
  /** Get dashboard stats */
  getStats: () => apiGet<{
    total_users: number
    total_admins: number
    total_phrases: number
    total_progress_records: number
    total_bookmarks: number
    total_views: number
    active_users: number
  }>('/admin/stats'),

  /** Get user activity summary */
  getActivitySummary: () => apiGet<any>('/admin/activity'),

  /** Get popular phrases */
  getPopularPhrases: (daysBack?: number) =>
    apiGet<any[]>('/admin/popular-phrases', daysBack ? { days_back: String(daysBack) } : undefined),
}

// =============================================================================
// Class Operations (School/Business Model)
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
// Enrollment Operations
// =============================================================================

export const enrollmentsApi = {
  /** List organization enrollments */
  listEnrollments: (params?: { organization_id?: string }) =>
    apiGet<any[]>('/enrollments', params as Record<string, string>),

  /** Enroll an organization (admin only) */
  enrollOrganization: (data: { organization_id: string; plan?: string; seat_count?: number }) =>
    apiPost<any>('/enrollments', data),
}

// =============================================================================
// API Key Management (Org Admin Self-Service)
// =============================================================================

export const apiKeysApi = {
  /** List API keys created by current user */
  listApiKeys: () => apiGet<any[]>('/admin/api-keys'),

  /** Create a new API key (returns plain key only once) */
  createApiKey: (data: { name: string; organization_id: string; scopes?: string[]; expires_in_days?: number }) =>
    apiPost<any>('/admin/api-keys', data),

  /** Update API key (name, scopes, active status) */
  updateApiKey: (id: string, data: Record<string, any>) => apiPut<any>(`/admin/api-keys/${id}`, data),

  /** Revoke an API key */
  revokeApiKey: (id: string) => apiDelete<any>(`/admin/api-keys/${id}`),
}

// =============================================================================
// OneRoster Sync Operations
// =============================================================================

export const oneRosterApi = {
  /** Sync roster from a OneRoster v1.1 compliant server (admin only) */
  syncRoster: (data: {
    oneroster_base_url: string
    oneroster_token_url?: string
    client_id: string
    client_secret: string
    organization_id: string
  }) => apiPost<{
    classes_synced: number
    users_synced: number
    enrollments_synced: number
    total_roster_classes: number
    total_roster_users: number
    total_roster_enrollments: number
  }>('/oneroster/sync', data),
}

// =============================================================================
// Analytics Operations (Python-powered)
// =============================================================================

export const analyticsApi = {
  /** Get platform overview analytics */
  getOverview: () => apiGet<any>('/analytics/overview'),

  /** Get learning velocity metrics */
  getLearningVelocity: () => apiGet<any>('/analytics/learning-velocity'),

  /** Get skill distribution analytics */
  getSkillDistribution: () => apiGet<any>('/analytics/skill-distribution'),

  /** Get engagement analytics */
  getEngagement: () => apiGet<any>('/analytics/engagement'),
}
