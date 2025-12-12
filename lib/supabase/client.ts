import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Support both EXPO_PUBLIC_ and NEXT_PUBLIC_ prefixes for backwards compatibility
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Password reset redirect URL - configurable via environment variable
const passwordResetRedirectUrl = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
  process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
  'nyuchilingo://reset-password'

// Check if we're running in a browser/client environment
const isClient = typeof window !== 'undefined'

// Custom storage adapter that uses SecureStore on native, AsyncStorage on web
// Only operates when in client environment
const ExpoSecureStoreAdapter = {
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

// Create a lazy supabase client that only initializes when URL is available
let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!_supabase) {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase not configured - running in offline mode')
      return null
    }
    _supabase = supabaseCreateClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: ExpoSecureStoreAdapter,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Flow lifetime for auth flows (password reset, magic link, etc.)
        // Default is 300 seconds (5 minutes)
        flowType: 'pkce', // Use PKCE for enhanced security on mobile
      },
    })
  }
  return _supabase
}

// For backwards compatibility - lazy initialization
export const supabase: SupabaseClient | null = null

// Auth helpers with null checks
export async function signInWithEmail(email: string, password: string) {
  const client = getSupabase()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabase()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }
  const { data, error } = await client.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export async function signOut() {
  const client = getSupabase()
  if (!client) {
    return { error: new Error('Supabase not configured') }
  }
  const { error } = await client.auth.signOut()
  return { error }
}

export async function getCurrentUser() {
  const client = getSupabase()
  if (!client) {
    return { user: null, error: null }
  }
  const { data: { user }, error } = await client.auth.getUser()
  return { user, error }
}

export async function getSession() {
  const client = getSupabase()
  if (!client) {
    return { session: null, error: null }
  }
  const { data: { session }, error } = await client.auth.getSession()
  return { session, error }
}

// Password reset - sends reset email
export async function resetPasswordForEmail(email: string) {
  const client = getSupabase()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }
  const { data, error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl,
  })
  return { data, error }
}

// Update password - called after user clicks reset link
export async function updatePassword(newPassword: string) {
  const client = getSupabase()
  if (!client) {
    return { data: null, error: new Error('Supabase not configured') }
  }
  const { data, error } = await client.auth.updateUser({
    password: newPassword,
  })
  return { data, error }
}

// Auth state change listener
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getSupabase()
  if (!client) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return client.auth.onAuthStateChange(callback)
}

// Alias for backwards compatibility with web codebase
// Returns the singleton Supabase client
export function createClient(): SupabaseClient {
  const client = getSupabase()
  if (!client) {
    throw new Error('Supabase not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
  }
  return client
}
