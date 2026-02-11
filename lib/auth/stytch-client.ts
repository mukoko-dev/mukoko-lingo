/**
 * Stytch Authentication Client for React Native / Expo
 * Replaces Supabase Auth with Stytch for authentication.
 *
 * Supports:
 * - Email/Password authentication
 * - OTP (One-Time Password) via email
 * - Magic links via email
 * - WhatsApp OTP authentication
 * - Session management with secure token storage
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Stytch configuration
const STYTCH_PROJECT_ID = process.env.EXPO_PUBLIC_STYTCH_PROJECT_ID || ''
const STYTCH_PUBLIC_TOKEN = process.env.EXPO_PUBLIC_STYTCH_PUBLIC_TOKEN || ''
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || ''
const PASSWORD_RESET_REDIRECT_URL =
  process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
  process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
  'mukokolingo://reset-password'
const MAGIC_LINK_REDIRECT_URL =
  process.env.EXPO_PUBLIC_MAGIC_LINK_REDIRECT_URL ||
  'mukokolingo://'

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
const SESSION_TOKEN_KEY = '@mukoko_stytch_session_token'
const USER_KEY = '@mukoko_stytch_user'

// =============================================================================
// Types
// =============================================================================

export interface StytchUser {
  user_id: string
  email: string
  phone_number?: string
  name?: {
    first_name?: string
    last_name?: string
  }
  created_at: string
  status: string
}

export interface StytchSession {
  session_token: string
  session_jwt?: string
  user: StytchUser
  expires_at: string
}

export interface AuthResult {
  data: {
    user?: StytchUser | null
    session?: StytchSession | null
  } | null
  error: Error | null
}

type AuthStateCallback = (event: string, session: StytchSession | null) => void
let _authStateListeners: AuthStateCallback[] = []
let _currentSession: StytchSession | null = null

// =============================================================================
// Internal Helpers
// =============================================================================

async function apiCall(endpoint: string, body: Record<string, any>): Promise<any> {
  const url = `${API_BASE_URL}/api/auth${endpoint}`

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
    if (!API_BASE_URL) {
      throw new Error('App not configured: missing API URL. Please set EXPO_PUBLIC_API_BASE_URL.')
    }
    throw new Error('Unable to reach the server. Please check your internet connection and try again.')
  }

  let data: any
  try {
    data = await response.json()
  } catch {
    throw new Error(`Server error (${response.status}). Please try again later.`)
  }

  if (!response.ok) {
    throw new Error(data.error || data.message || `Auth request failed (${response.status})`)
  }

  return data
}

function notifyAuthStateChange(event: string, session: StytchSession | null) {
  _currentSession = session
  _authStateListeners.forEach(cb => {
    try { cb(event, session) } catch (e) { console.error('Auth listener error:', e) }
  })
}

async function persistSession(session: StytchSession): Promise<void> {
  await SecureStorageAdapter.setItem(SESSION_TOKEN_KEY, session.session_token)
  await SecureStorageAdapter.setItem(USER_KEY, JSON.stringify(session.user))
}

async function clearPersistedSession(): Promise<void> {
  await SecureStorageAdapter.removeItem(SESSION_TOKEN_KEY)
  await SecureStorageAdapter.removeItem(USER_KEY)
}

// =============================================================================
// Auth Functions (Public API - drop-in replacement for Supabase auth)
// =============================================================================

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await apiCall('/login', { email, password })
    const session: StytchSession = {
      session_token: data.session_token,
      session_jwt: data.session_jwt,
      user: data.user,
      expires_at: data.expires_at,
    }
    await persistSession(session)
    notifyAuthStateChange('SIGNED_IN', session)
    return { data: { user: data.user, session }, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  try {
    const data = await apiCall('/register', { email, password })
    const session: StytchSession | null = data.session_token
      ? {
          session_token: data.session_token,
          session_jwt: data.session_jwt,
          user: data.user,
          expires_at: data.expires_at,
        }
      : null

    if (session) {
      await persistSession(session)
      notifyAuthStateChange('SIGNED_IN', session)
    }

    return {
      data: { user: data.user, session },
      error: null,
    }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Send OTP code to email (works for both sign-in and sign-up)
 * Returns the method_id needed for verification.
 */
export async function signInWithOtp(email: string): Promise<AuthResult & { method_id?: string }> {
  try {
    const data = await apiCall('/otp/send', { email })
    return { data: { user: null, session: null }, error: null, method_id: data.method_id }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Verify OTP code
 * @param methodId - The method_id returned from signInWithOtp
 * @param token - The 6-digit OTP code
 */
export async function verifyOtp(methodId: string, token: string): Promise<AuthResult> {
  try {
    const data = await apiCall('/otp/verify', { method_id: methodId, code: token })
    const session: StytchSession = {
      session_token: data.session_token,
      session_jwt: data.session_jwt,
      user: data.user,
      expires_at: data.expires_at,
    }
    await persistSession(session)
    notifyAuthStateChange('SIGNED_IN', session)
    return { data: { user: data.user, session }, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Send WhatsApp OTP to phone number (works for both sign-in and sign-up)
 * Phone number must be in E.164 format (e.g. +263771234567)
 * Returns the method_id needed for verification.
 */
export async function signInWithWhatsApp(phoneNumber: string): Promise<AuthResult & { method_id?: string }> {
  try {
    const data = await apiCall('/whatsapp/send', { phone_number: phoneNumber })
    return { data: { user: null, session: null }, error: null, method_id: data.method_id }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Verify WhatsApp OTP code
 * @param methodId - The method_id returned from signInWithWhatsApp
 * @param code - The 6-digit OTP code
 * @param phoneNumber - Original phone number for profile creation fallback
 */
export async function verifyWhatsAppOtp(methodId: string, code: string, phoneNumber?: string): Promise<AuthResult> {
  try {
    const data = await apiCall('/whatsapp/verify', { method_id: methodId, code, phone_number: phoneNumber })
    const session: StytchSession = {
      session_token: data.session_token,
      session_jwt: data.session_jwt,
      user: data.user,
      expires_at: data.expires_at,
    }
    await persistSession(session)
    notifyAuthStateChange('SIGNED_IN', session)
    return { data: { user: data.user, session }, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Send magic link to email
 */
export async function signInWithMagicLink(email: string): Promise<AuthResult> {
  try {
    const data = await apiCall('/magic-link/send', {
      email,
      redirect_url: MAGIC_LINK_REDIRECT_URL,
    })
    return { data: { user: null, session: null }, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Authenticate magic link token (called when deep link is received)
 */
export async function authenticateMagicLink(token: string): Promise<AuthResult> {
  try {
    const data = await apiCall('/magic-link/authenticate', { token })
    const session: StytchSession = {
      session_token: data.session_token,
      session_jwt: data.session_jwt,
      user: data.user,
      expires_at: data.expires_at,
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
    const sessionToken = await SecureStorageAdapter.getItem(SESSION_TOKEN_KEY)
    if (sessionToken) {
      try {
        await apiCall('/logout', { session_token: sessionToken })
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
export async function getCurrentUser(): Promise<{ user: StytchUser | null; error: Error | null }> {
  try {
    const userJson = await SecureStorageAdapter.getItem(USER_KEY)
    if (!userJson) return { user: null, error: null }

    const user = JSON.parse(userJson) as StytchUser
    return { user, error: null }
  } catch (error: any) {
    return { user: null, error }
  }
}

/**
 * Get current session
 */
export async function getSession(): Promise<{ session: StytchSession | null; error: Error | null }> {
  try {
    const sessionToken = await SecureStorageAdapter.getItem(SESSION_TOKEN_KEY)
    if (!sessionToken) return { session: null, error: null }

    const userJson = await SecureStorageAdapter.getItem(USER_KEY)
    if (!userJson) return { session: null, error: null }

    const user = JSON.parse(userJson) as StytchUser
    const session: StytchSession = {
      session_token: sessionToken,
      user,
      expires_at: '', // Will be refreshed on next API call
    }

    // Validate session with server
    try {
      const data = await apiCall('/session/validate', { session_token: sessionToken })
      session.user = data.user || user
      session.expires_at = data.expires_at || ''
      // Update stored user in case it changed
      await SecureStorageAdapter.setItem(USER_KEY, JSON.stringify(session.user))
      return { session, error: null }
    } catch {
      // Session expired or invalid
      await clearPersistedSession()
      notifyAuthStateChange('TOKEN_REFRESHED', null)
      return { session: null, error: null }
    }
  } catch (error: any) {
    return { session: null, error }
  }
}

/**
 * Request password reset email
 */
export async function resetPasswordForEmail(email: string): Promise<AuthResult> {
  try {
    await apiCall('/password/reset-request', {
      email,
      redirect_url: PASSWORD_RESET_REDIRECT_URL,
    })
    return { data: { user: null, session: null }, error: null }
  } catch (error: any) {
    return { data: null, error }
  }
}

/**
 * Update password (requires active session)
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const sessionToken = await SecureStorageAdapter.getItem(SESSION_TOKEN_KEY)
    if (!sessionToken) {
      throw new Error('No active session. Please sign in first.')
    }

    const data = await apiCall('/password/update', {
      session_token: sessionToken,
      new_password: newPassword,
    })

    return { data: { user: data.user, session: null }, error: null }
  } catch (error: any) {
    return { data: null, error }
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
 * Get the current session token for API calls
 */
export async function getSessionToken(): Promise<string | null> {
  return SecureStorageAdapter.getItem(SESSION_TOKEN_KEY)
}

/**
 * Check if Stytch is configured
 */
export function isAuthConfigured(): boolean {
  return !!(API_BASE_URL)
}
