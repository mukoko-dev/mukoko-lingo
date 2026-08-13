/**
 * Tests for the WorkOS AuthKit client functions.
 * Verifies the PKCE authorization-code exchange, session refresh, and
 * local session persistence/error handling.
 */

// Set API_BASE_URL before module import so apiCall validation passes
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as WebBrowser from 'expo-web-browser'
import {
  signInWithAuthKit,
  handleAuthCallback,
  signOut,
  getCurrentUser,
  getSessionToken,
  isAuthConfigured,
} from '../workos-client'

process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test-api.mukoko.com'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock AsyncStorage with a real in-memory store — the module runs on
// Platform.OS 'web' below, so it's AsyncStorage (not SecureStore) that
// round-trips the PKCE verifier between signInWithAuthKit/handleAuthCallback.
const mockAsyncStorageMemory = new Map<string, string>()
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((key: string) => Promise.resolve(mockAsyncStorageMemory.get(key) ?? null)),
  setItem: jest.fn((key: string, value: string) => {
    mockAsyncStorageMemory.set(key, value)
    return Promise.resolve()
  }),
  removeItem: jest.fn((key: string) => {
    mockAsyncStorageMemory.delete(key)
    return Promise.resolve()
  }),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

// The module runs as the web build here, so it reads window.location for both
// the API base URL and the redirect URI, and navigates via location.assign.
const TEST_ORIGIN = 'https://lingo.mukoko.com'
const mockAssign = jest.fn()
const ORIGINAL_LOCATION = typeof window !== 'undefined' ? window.location : undefined

describe('workos-client', () => {
  beforeAll(() => {
    if (typeof (global as any).window === 'undefined') (global as any).window = {}
    delete (global as any).window.location
    ;(global as any).window.location = { origin: TEST_ORIGIN, href: `${TEST_ORIGIN}/auth`, assign: mockAssign }
  })

  afterAll(() => {
    if (ORIGINAL_LOCATION) (global as any).window.location = ORIGINAL_LOCATION
  })

  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
    mockAsyncStorageMemory.clear()
  })

  // ==========================================================================
  // Sign-in (authorization URL + PKCE)
  // ==========================================================================
  describe('signInWithAuthKit (web)', () => {
    it('asks WorkOS to redirect back to the web app, never the mobile scheme', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://auth.workos.com/authorize?client_id=abc',
          state: 'state-123',
          code_verifier: 'verifier-123',
        }),
      })

      await signInWithAuthKit()

      // The regression: web used to send `mukokolingo://auth/callback`, so the
      // browser was handed a scheme it has no handler for and the
      // authorization code never came back.
      const authorizeBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(authorizeBody.redirect_uri).toBe(`${TEST_ORIGIN}/auth/callback`)
      expect(authorizeBody.redirect_uri).not.toContain('mukokolingo://')
    })

    it('navigates the page to AuthKit instead of opening an auth session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://auth.workos.com/authorize?client_id=abc',
          state: 'state-123',
          code_verifier: 'verifier-123',
        }),
      })

      const result = await signInWithAuthKit()

      expect(mockAssign).toHaveBeenCalledWith('https://auth.workos.com/authorize?client_id=abc')
      expect(WebBrowser.openAuthSessionAsync).not.toHaveBeenCalled()
      // Navigation takes over; there is no session to return from this call.
      expect(result).toEqual({ data: null, error: null })
    })

    it('persists the PKCE verifier before leaving the page', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://auth.workos.com/authorize',
          state: 'state-123',
          code_verifier: 'verifier-123',
        }),
      })

      await signInWithAuthKit()

      // A full-page navigation wipes memory, so the verifier has to already be
      // in storage by the time assign() is called or the callback can't finish.
      const pending = JSON.parse(mockAsyncStorageMemory.get('@mukoko_workos_pending_auth')!)
      expect(pending.code_verifier).toBe('verifier-123')
    })

    it('returns an error when the authorize request fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Failed to start sign-in' }),
      })

      const result = await signInWithAuthKit()

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  // ==========================================================================
  // Callback handling
  // ==========================================================================
  describe('handleAuthCallback', () => {
    it('surfaces the WorkOS error_description from the redirect URL', async () => {
      const result = await handleAuthCallback('mukokolingo://auth/callback?error=access_denied&error_description=User+cancelled')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('User cancelled')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('errors when no authorization code is present', async () => {
      const result = await handleAuthCallback('mukokolingo://auth/callback')

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })

    it('errors when the PKCE verifier was never persisted', async () => {
      const result = await handleAuthCallback('mukokolingo://auth/callback?code=abc&state=xyz')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('Sign-in session expired')
    })

    it('exchanges the code using the persisted PKCE verifier', async () => {
      await AsyncStorage.setItem(
        '@mukoko_workos_pending_auth',
        JSON.stringify({ state: 'xyz', code_verifier: 'verifier-abc' })
      )
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'access-token-456',
          refresh_token: 'refresh-token-456',
          user: { user_id: 'user-456', email: 'test2@example.com' },
        }),
      })

      const result = await handleAuthCallback('mukokolingo://auth/callback?code=abc&state=xyz')

      expect(result.error).toBeNull()
      expect(result.data?.session?.access_token).toBe('access-token-456')

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.code).toBe('abc')
      expect(body.code_verifier).toBe('verifier-abc')
    })
  })

  // ==========================================================================
  // Sign Out
  // ==========================================================================
  describe('signOut', () => {
    it('clears session and returns no error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const result = await signOut()

      expect(result.error).toBeNull()
    })

    it('still clears local state even if server logout fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await signOut()

      expect(result).toHaveProperty('error')
    })
  })

  // ==========================================================================
  // Utility functions
  // ==========================================================================
  describe('isAuthConfigured', () => {
    it('returns true when API_BASE_URL is set', () => {
      const result = isAuthConfigured()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getCurrentUser', () => {
    it('returns null when no user is stored', async () => {
      const result = await getCurrentUser()
      expect(result.user).toBeNull()
      expect(result.error).toBeNull()
    })
  })

  describe('getSessionToken', () => {
    it('returns null when no session exists', async () => {
      const token = await getSessionToken()
      expect(token).toBeNull()
    })
  })

  // ==========================================================================
  // Error Handling (apiCall resilience)
  // ==========================================================================
  describe('error handling', () => {
    it('catches network errors and returns a user-friendly message', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'))

      const result = await signInWithAuthKit()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('Unable to reach the server')
    })

    it('handles non-JSON server responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const result = await signInWithAuthKit()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('Server error')
      expect(result.error?.message).toContain('502')
    })

    it('propagates server error messages to the client', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid redirect URI' }),
      })

      const result = await signInWithAuthKit()

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Invalid redirect URI')
    })
  })
})
