/**
 * WorkOS AuthKit Client for React Native / Expo
 *
 * Sign-in happens on WorkOS's hosted AuthKit page (email/password, magic
 * auth, social — whatever the AuthKit environment has enabled). This module
 * only handles the PKCE authorization-code dance and local session storage;
 * the shared `/api/auth/*` Vercel functions do the actual token exchange.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { Platform } from 'react-native'

const REDIRECT_URI = process.env.EXPO_PUBLIC_WORKOS_REDIRECT_URI || 'mukokolingo://auth/callback'

// Read lazily so env can be set after module load (tests, dynamic config)
function getApiBaseUrl(): string {
  return process.env.EXPO_PUBLIC_API_BASE_URL || ''
}

// Check if we're running in a browser/client environment
const isClient = typeof window !== 'undefined'

// =============================================================================
// Secure Storage Adapter (platform-specific)
// =============================================================================

const SecureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isClient) return null
    if (Platform.OS === 'web') {
      return AsyncStorage.getItem(key)
    }
    return SecureStore.getItemAsync(key)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isClient) return
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value)
      return
    }
    await SecureStore.setItemAsync(key, value)
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isClient) return
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key)
      return
    }
    await SecureStore.deleteItemAsync(key)
  },
}

// Storage keys
const ACCESS_TOKEN_KEY = '@mukoko_workos_access_token'
const REFRESH_TOKEN_KEY = '@mukoko_workos_refresh_token'
const USER_KEY = '@mukoko_workos_user'
const PENDING_AUTH_KEY = '@mukoko_workos_pending_auth'

// =============================================================================
// Types
// =============================================================================

export interface WorkOSUser {
  user_id: string
  email: string
  name?: {
    first_name?: string
    last_name?: string
  }
  created_at?: string
}

export interface WorkOSSession {
  access_token: string
  refresh_token: string
  user: WorkOSUser
}

export interface AuthResult {
  data: {
    user?: WorkOSUser | null
    session?: WorkOSSession | null
  } | null
  error: Error | null
}

type AuthStateCallback = (event: string, session: WorkOSSession | null) => void
let _authStateListeners: AuthStateCallback[] = []

// =============================================================================
// Internal Helpers
// =============================================================================

async function apiCall(endpoint: string, body: Record<string, any>): Promise<any> {
  const apiBase = getApiBaseUrl()
  if (!apiBase) {
    throw new Error('App not configured: missing API URL. Please set EXPO_PUBLIC_API_BASE_URL.')
  }

  const url = `${apiBase}/api/auth${endpoint}`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
  } catch (networkError: any) {
    // Network-level failure (DNS, connection refused, CORS, offline)
    throw new Error('Unable to reach the server. Please check your internet connection and try again.')
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server error (${response.status}). Please try again later.`)
  }

  if (!response.ok) {
    const err = new Error(data.error || data.message || `Auth request failed (${response.status})`)
    ;(err as any).statusCode = response.status
    throw err
  }

  return data
}

function notifyAuthStateChange(event: string, session: WorkOSSession | null) {
  _authStateListeners.forEach(cb => {
    try { cb(event, session) } catch (e) { console.error('Auth listener error:', e) }
  })
}

async function persistSession(session: WorkOSSession): Promise<void> {
  await SecureStorageAdapter.setItem(ACCESS_TOKEN_KEY, session.access_token)
  await SecureStorageAdapter.setItem(REFRESH_TOKEN_KEY, session.refresh_token)
  await SecureStorageAdapter.setItem(USER_KEY, JSON.stringify(session.user))
}

async function clearPersistedSession(): Promise<void> {
  await SecureStorageAdapter.removeItem(ACCESS_TOKEN_KEY)
  await SecureStorageAdapter.removeItem(REFRESH_TOKEN_KEY)
  await SecureStorageAdapter.removeItem(USER_KEY)
}

// =============================================================================
// Auth Functions (Public API)
// =============================================================================

/**
 * Start the AuthKit hosted sign-in flow.
 * Opens WorkOS's hosted login page and completes the PKCE code exchange
 * once the browser redirects back to this app.
 */
export async function signInWithAuthKit(screenHint?: 'sign-in' | 'sign-up'): Promise<AuthResult> {
  try {
    const { url, state, code_verifier } = await apiCall('/authorize', {
      redirect_uri: REDIRECT_URI,
      screen_hint: screenHint,
    })

    // Persist the PKCE verifier in case the app is backgrounded/reloaded
    // before the redirect lands (e.g. the OS hands control back via a cold
    // start deep link instead of resolving openAuthSessionAsync directly).
    await SecureStorageAdapter.setItem(PENDING_AUTH_KEY, JSON.stringify({ state, code_verifier }))

    const result = await WebBrowser.openAuthSessionAsync(url, REDIRECT_URI)

    if (result.type !== 'success' || !result.url) {
      return { data: null, error: null } // user cancelled — not an error
    }

    return handleAuthCallback(result.url)
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Complete the AuthKit callback (called with the deep link URL, whether it
 * arrived via openAuthSessionAsync's result or a cold-start deep link).
 */
export async function handleAuthCallback(url: string): Promise<AuthResult> {
  try {
    const parsed = new URL(url)
    const code = parsed.searchParams.get('code')
    const authError = parsed.searchParams.get('error_description') || parsed.searchParams.get('error')

    if (authError) {
      return { data: null, error: new Error(authError) }
    }
    if (!code) {
      return { data: null, error: new Error('No authorization code found in the sign-in redirect.') }
    }

    const pendingJson = await SecureStorageAdapter.getItem(PENDING_AUTH_KEY)
    const pending = pendingJson ? JSON.parse(pendingJson) : null
    if (!pending?.code_verifier) {
      return { data: null, error: new Error('Sign-in session expired. Please try again.') }
    }

    const data = await apiCall('/callback', { code, code_verifier: pending.code_verifier })
    await SecureStorageAdapter.removeItem(PENDING_AUTH_KEY)

    const session: WorkOSSession = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      user: data.user,
    }
    await persistSession(session)
    notifyAuthStateChange('SIGNED_IN', session)
    return { data: { user: data.user, session }, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: Error | null }> {
  try {
    const accessToken = await SecureStorageAdapter.getItem(ACCESS_TOKEN_KEY)
    if (accessToken) {
      try {
        await apiCall('/logout', { access_token: accessToken })
      } catch {
        // Ignore server errors during logout - still clear local state
      }
    }
    await clearPersistedSession()
    notifyAuthStateChange('SIGNED_OUT', null)
    return { error: null }
  } catch (error: any) {
    await clearPersistedSession()
    notifyAuthStateChange('SIGNED_OUT', null)
    return { error }
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<{ user: WorkOSUser | null; error: Error | null }> {
  try {
    const userJson = await SecureStorageAdapter.getItem(USER_KEY)
    if (!userJson) return { user: null, error: null }

    const user = JSON.parse(userJson) as WorkOSUser
    return { user, error: null }
  } catch (error: any) {
    return { user: null, error }
  }
}

/**
 * Get current session, refreshing the access token if it's expired.
 */
export async function getSession(): Promise<{ session: WorkOSSession | null; error: Error | null }> {
  try {
    const accessToken = await SecureStorageAdapter.getItem(ACCESS_TOKEN_KEY)
    const refreshToken = await SecureStorageAdapter.getItem(REFRESH_TOKEN_KEY)
    const userJson = await SecureStorageAdapter.getItem(USER_KEY)
    if (!accessToken || !refreshToken || !userJson) return { session: null, error: null }

    const user = JSON.parse(userJson) as WorkOSUser
    const session: WorkOSSession = { access_token: accessToken, refresh_token: refreshToken, user }

    // Check whether the access token still validates
    try {
      const url = `${getApiBaseUrl()}/api/auth/session/validate`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      })

      if (response.ok) {
        return { session, error: null }
      }

      if (response.status === 401) {
        // Access token expired — try to refresh it
        try {
          const refreshed = await apiCall('/refresh', { refresh_token: refreshToken })
          const newSession: WorkOSSession = {
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token,
            user,
          }
          await persistSession(newSession)
          return { session: newSession, error: null }
        } catch {
          // Refresh token is also invalid — genuinely signed out
          await clearPersistedSession()
          notifyAuthStateChange('TOKEN_REFRESHED', null)
          return { session: null, error: null }
        }
      }

      // Server error (5xx) — keep the local session, don't log out
      console.warn(`[mukoko][auth] Session validation returned ${response.status}, keeping local session`)
      return { session, error: null }
    } catch {
      // Network error — keep the local session, don't log out
      console.warn('[mukoko][auth] Session validation network error, keeping local session')
      return { session, error: null }
    }
  } catch (error: any) {
    return { session: null, error }
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback: AuthStateCallback) {
  _authStateListeners.push(callback)
  return {
    data: {
      subscription: {
        unsubscribe: () => {
          _authStateListeners = _authStateListeners.filter(cb => cb !== callback)
        },
      },
    },
  }
}

/**
 * Get the current access token for API calls
 */
export async function getSessionToken(): Promise<string | null> {
  return SecureStorageAdapter.getItem(ACCESS_TOKEN_KEY)
}

/**
 * Check if WorkOS AuthKit is configured
 */
export function isAuthConfigured(): boolean {
  return !!getApiBaseUrl()
}
