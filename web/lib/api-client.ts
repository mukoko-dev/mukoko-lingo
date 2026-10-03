/**
 * API Client for Mukoko Lingo Web App
 *
 * Full API surface — includes both learner and admin operations.
 * Calls the shared Vercel serverless API routes.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  // Web app uses cookie-based or localStorage session tokens
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem(ACCESS_TOKEN_KEY)
      : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

const ACCESS_TOKEN_KEY = "workos_access_token";
const REFRESH_TOKEN_KEY = "workos_refresh_token";

let refreshInFlight: Promise<string | null> | null = null;

/**
 * Swap the stored WorkOS refresh token for a new access/refresh pair. WorkOS
 * decides how long the sign-in lasts; the access token itself lives only
 * minutes, so without this every call after it expires fails with 401.
 * The tokens are cleared only when the refresh endpoint says the WorkOS
 * session is over (401) — never on a network error or a 5xx.
 */
function refreshAccessToken(): Promise<string | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (response.status === 401) {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
        return null;
      }
      if (!response.ok) return null;
      const data = await response.json();
      localStorage.setItem(ACCESS_TOKEN_KEY, data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token);
      return data.access_token as string;
    } catch {
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

/** fetch, plus one refresh-and-retry when an authenticated call gets 401. */
async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, init);
  const headers = (init.headers ?? {}) as Record<string, string>;
  if (response.status !== 401 || !headers["Authorization"]) return response;
  const token = await refreshAccessToken();
  if (!token) return response;
  return fetch(url, {
    ...init,
    headers: { ...headers, Authorization: `Bearer ${token}` },
  });
}

async function apiGet<T>(
  path: string,
  params?: Record<string, string>,
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const url = new URL(`${API_BASE_URL}/api${path}`);
    if (params)
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const response = await authedFetch(url.toString(), { method: "GET", headers });
    const data = await response.json();
    if (!response.ok)
      return {
        data: null,
        error: data.error || `Request failed: ${response.status}`,
      };
    return { data: data.data ?? data, error: null, count: data.count };
  } catch (error: any) {
    return { data: null, error: error.message || "Network error" };
  }
}

async function apiPost<T>(
  path: string,
  body: Record<string, any>,
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const response = await authedFetch(`${API_BASE_URL}/api${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok)
      return {
        data: null,
        error: data.error || `Request failed: ${response.status}`,
      };
    return { data: data.data ?? data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Network error" };
  }
}

async function apiPut<T>(
  path: string,
  body: Record<string, any>,
): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const response = await authedFetch(`${API_BASE_URL}/api${path}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok)
      return {
        data: null,
        error: data.error || `Request failed: ${response.status}`,
      };
    return { data: data.data ?? data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Network error" };
  }
}

async function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  try {
    const headers = await getAuthHeaders();
    const response = await authedFetch(`${API_BASE_URL}/api${path}`, {
      method: "DELETE",
      headers,
    });
    const data = await response.json();
    if (!response.ok)
      return {
        data: null,
        error: data.error || `Request failed: ${response.status}`,
      };
    return { data: data.data ?? data, error: null };
  } catch (error: any) {
    return { data: null, error: error.message || "Network error" };
  }
}

// ── Learner Operations ─────────────────────────────────────────────────────

export const phrasesApi = {
  listPhrases: (params?: Record<string, string>) =>
    apiGet<any[]>("/phrases", params),
  getPhrase: (id: string) => apiGet<any>(`/phrases/${id}`),
};

export const bookmarksApi = {
  listBookmarks: () => apiGet<any[]>("/bookmarks"),
  addBookmark: (phraseId: string) =>
    apiPost<any>("/bookmarks", { phrase_id: phraseId }),
  removeBookmark: (phraseId: string) =>
    apiDelete<any>(`/bookmarks/${phraseId}`),
};

export const progressApi = {
  getProgress: () => apiGet<any[]>("/progress"),
  updateProgress: (phraseId: string, status: string) =>
    apiPost<any>("/progress", { phrase_id: phraseId, status }),
};

export const skillsApi = {
  listSkills: () => apiGet<any[]>("/skills"),
  getUserSkills: () => apiGet<any[]>("/skills/user"),
  getSkillLevels: () => apiGet<any[]>("/skills/levels"),
};

export const assessmentsApi = {
  listAssessments: (params?: Record<string, string>) =>
    apiGet<any[]>("/assessments", params),
  getAssessment: (id: string) => apiGet<any>(`/assessments/${id}`),
  submitAssessment: (data: Record<string, any>) =>
    apiPost<any>("/assessments/submit", data),
  getUserAssessments: () => apiGet<any[]>("/assessments/user"),
};

export const profilesApi = {
  getMyProfile: () => apiGet<any>("/profiles/me"),
  updateMyProfile: (data: Record<string, any>) =>
    apiPut<any>("/profiles/me", data),
};

export const aiApi = {
  chat: (messages: any[], systemPrompt?: string) =>
    apiPost<any>("/ai/chat", { messages, system_prompt: systemPrompt }),
  listConversations: () => apiGet<any[]>("/ai/conversations"),
  getMessages: (conversationId: string) =>
    apiGet<any[]>(`/ai/conversations/${conversationId}/messages`),
  createConversation: (data: Record<string, any>) =>
    apiPost<any>("/ai/conversations", data),
  storeMessage: (conversationId: string, data: Record<string, any>) =>
    apiPost<any>(`/ai/conversations/${conversationId}/messages`, data),
};

export const studySessionsApi = {
  getSessions: () => apiGet<any[]>("/study-sessions"),
  recordSession: (data: Record<string, any>) =>
    apiPost<any>("/study-sessions", data),
};

// ── Teacher/Class Operations ───────────────────────────────────────────────

export const classesApi = {
  listClasses: (params?: Record<string, string>) =>
    apiGet<any[]>("/classes", params),
  getClass: (id: string) => apiGet<any>(`/classes/${id}`),
  createClass: (data: Record<string, any>) => apiPost<any>("/classes", data),
  updateClass: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/classes/${id}`, data),
  deleteClass: (id: string) => apiDelete<any>(`/classes/${id}`),
  getMembers: (classId: string) => apiGet<any[]>(`/classes/${classId}/members`),
  addMember: (classId: string, data: Record<string, any>) =>
    apiPost<any>(`/classes/${classId}/members`, data),
};

export const assignmentsApi = {
  listAssignments: (classId: string) =>
    apiGet<any[]>("/assignments", { class_id: classId }),
  getAssignment: (id: string) => apiGet<any>(`/assignments/${id}`),
  createAssignment: (data: Record<string, any>) =>
    apiPost<any>("/assignments", data),
  updateAssignment: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/assignments/${id}`, data),
  deleteAssignment: (id: string) => apiDelete<any>(`/assignments/${id}`),
  submitAssignment: (id: string, data: Record<string, any>) =>
    apiPost<any>(`/assignments/${id}/submit`, data),
};

// ── Admin Operations (web app only) ────────────────────────────────────────

export const adminApi = {
  getStats: () => apiGet<any>("/admin/stats"),
  getActivity: () => apiGet<any>("/admin/activity"),
  getPopularPhrases: (daysBack?: number) =>
    apiGet<any[]>(
      "/admin/popular-phrases",
      daysBack ? { days_back: String(daysBack) } : undefined,
    ),
};

export const adminUsersApi = {
  listUsers: (params?: Record<string, string>) =>
    apiGet<any[]>("/profiles", params),
  getUser: (id: string) => apiGet<any>(`/profiles/${id}`),
  updateRole: (id: string, role: string) =>
    apiPut<any>(`/admin/users/${id}/role`, { role }),
  updateStatus: (id: string, status: string) =>
    apiPut<any>(`/admin/users/${id}/status`, { status }),
};

export const adminPhrasesApi = {
  createPhrase: (data: Record<string, any>) =>
    apiPost<any>("/admin/phrases", data),
  updatePhrase: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/phrases/${id}`, data),
  deletePhrase: (id: string) => apiDelete<any>(`/admin/phrases/${id}`),
};

export const adminSkillsApi = {
  updateSkill: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/skills/${id}`, data),
};

export const standardsApi = {
  listStandards: () => apiGet<any[]>("/admin/standards"),
  updateStandard: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/standards/${id}`, data),
};

export const moderationApi = {
  listAlerts: (params?: Record<string, string>) =>
    apiGet<any[]>("/admin/moderation", params),
  updateAlert: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/moderation/${id}`, data),
};

export const guardrailsApi = {
  listGuardrails: () => apiGet<any[]>("/admin/guardrails"),
  updateGuardrail: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/guardrails/${id}`, data),
};

export const enrollmentsApi = {
  listEnrollments: (params?: Record<string, string>) =>
    apiGet<any[]>("/enrollments", params),
  enrollOrganization: (data: Record<string, any>) =>
    apiPost<any>("/enrollments", data),
};

export const oneRosterApi = {
  syncRoster: (data: Record<string, any>) =>
    apiPost<any>("/oneroster/sync", data),
};

export const apiKeysApi = {
  listApiKeys: () => apiGet<any[]>("/admin/api-keys"),
  createApiKey: (data: Record<string, any>) =>
    apiPost<any>("/admin/api-keys", data),
  updateApiKey: (id: string, data: Record<string, any>) =>
    apiPut<any>(`/admin/api-keys/${id}`, data),
  revokeApiKey: (id: string) => apiDelete<any>(`/admin/api-keys/${id}`),
};

export const analyticsApi = {
  getOverview: () => apiGet<any>("/analytics/overview"),
  getLearningVelocity: () => apiGet<any>("/analytics/learning-velocity"),
  getSkillDistribution: () => apiGet<any>("/analytics/skill-distribution"),
  getEngagement: () => apiGet<any>("/analytics/engagement"),
};
