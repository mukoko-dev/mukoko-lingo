import { createClient as supabaseCreateClient, SupabaseClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Environment configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const passwordResetRedirectUrl = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
  process.env.NEXT_PUBLIC_PASSWORD_RESET_REDIRECT_URL ||
  'nyuchilingo://reset-password'

// Check if we're running in a browser/client environment
const isClient = typeof window !== 'undefined'

// Custom storage adapter: SecureStore on native, AsyncStorage on web
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

// Singleton Supabase client - lazy initialized
let _supabase: SupabaseClient | null = null

/**
 * Get the Supabase client singleton.
 * Returns null if Supabase is not configured (offline mode).
 */
export function getSupabase(): SupabaseClient | null {
  if (_supabase) return _supabase

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
      flowType: 'pkce',
    },
  })

  return _supabase
}

/**
 * Get the Supabase client, throwing if not configured.
 * Use this when Supabase is required (will fail fast).
 */
export function createClient(): SupabaseClient {
  const client = getSupabase()
  if (!client) {
    throw new Error('Supabase not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY')
  }
  return client
}

// =============================================================================
// Auth Helper Functions
// =============================================================================

export async function signInWithEmail(email: string, password: string) {
  const client = getSupabase()
  if (!client) return { data: null, error: new Error('Supabase not configured') }

  return client.auth.signInWithPassword({ email, password })
}

export async function signUpWithEmail(email: string, password: string) {
  const client = getSupabase()
  if (!client) return { data: null, error: new Error('Supabase not configured') }

  return client.auth.signUp({ email, password })
}

export async function signOut() {
  const client = getSupabase()
  if (!client) return { error: new Error('Supabase not configured') }

  return client.auth.signOut()
}

export async function getCurrentUser() {
  const client = getSupabase()
  if (!client) return { user: null, error: null }

  const { data: { user }, error } = await client.auth.getUser()
  return { user, error }
}

export async function getSession() {
  const client = getSupabase()
  if (!client) return { session: null, error: null }

  const { data: { session }, error } = await client.auth.getSession()
  return { session, error }
}

export async function resetPasswordForEmail(email: string) {
  const client = getSupabase()
  if (!client) return { data: null, error: new Error('Supabase not configured') }

  return client.auth.resetPasswordForEmail(email, {
    redirectTo: passwordResetRedirectUrl,
  })
}

export async function updatePassword(newPassword: string) {
  const client = getSupabase()
  if (!client) return { data: null, error: new Error('Supabase not configured') }

  return client.auth.updateUser({ password: newPassword })
}

export function onAuthStateChange(callback: (event: string, session: any) => void) {
  const client = getSupabase()
  if (!client) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return client.auth.onAuthStateChange(callback)
}
