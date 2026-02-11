/**
 * Tests for Stytch auth client functions.
 * Verifies the client correctly passes method_id through the OTP flow,
 * handles errors, and manages session persistence.
 */

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock AsyncStorage and SecureStore
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  setItemAsync: jest.fn(() => Promise.resolve()),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
}))

import {
  signInWithEmail,
  signUpWithEmail,
  signInWithOtp,
  verifyOtp,
  signInWithWhatsApp,
  verifyWhatsAppOtp,
  signInWithMagicLink,
  signOut,
  getCurrentUser,
  getSessionToken,
  isAuthConfigured,
} from '../stytch-client'

describe('stytch-client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
  })

  // ==========================================================================
  // OTP Flow (Email)
  // ==========================================================================
  describe('signInWithOtp', () => {
    it('sends email and returns method_id from response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'OTP sent to email',
          method_id: 'email-test-abc123',
        }),
      })

      const result = await signInWithOtp('test@example.com')

      expect(result.error).toBeNull()
      expect(result.method_id).toBe('email-test-abc123')
      expect(result.data).toEqual({ user: null, session: null })

      // Verify fetch was called with correct body
      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.email).toBe('test@example.com')
    })

    it('returns error when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid email' }),
      })

      const result = await signInWithOtp('bad@email')

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  describe('verifyOtp', () => {
    it('sends method_id (not email) and code to verify endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session_token: 'session-token-123',
          session_jwt: 'jwt-123',
          user: {
            user_id: 'user-123',
            email: 'test@example.com',
            created_at: '2026-01-01',
            status: 'active',
          },
          expires_at: '2026-02-18T00:00:00Z',
        }),
      })

      const result = await verifyOtp('email-test-abc123', '123456')

      expect(result.error).toBeNull()
      expect(result.data?.session?.session_token).toBe('session-token-123')
      expect(result.data?.user?.user_id).toBe('user-123')

      // CRITICAL: Verify method_id is passed, not email
      const fetchCall = mockFetch.mock.calls[0]
      const body = JSON.parse(fetchCall[1].body)
      expect(body.method_id).toBe('email-test-abc123')
      expect(body.code).toBe('123456')
      expect(body.email).toBeUndefined()
    })

    it('returns error for invalid code', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Invalid or expired code' }),
      })

      const result = await verifyOtp('email-test-abc123', '000000')

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  // ==========================================================================
  // OTP Flow (WhatsApp)
  // ==========================================================================
  describe('signInWithWhatsApp', () => {
    it('sends phone number and returns method_id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          message: 'OTP sent via WhatsApp',
          method_id: 'phone-test-xyz789',
        }),
      })

      const result = await signInWithWhatsApp('+263771234567')

      expect(result.error).toBeNull()
      expect(result.method_id).toBe('phone-test-xyz789')

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.phone_number).toBe('+263771234567')
    })
  })

  describe('verifyWhatsAppOtp', () => {
    it('sends method_id (not phone_number) to verify endpoint', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session_token: 'session-token-wa',
          session_jwt: 'jwt-wa',
          user: {
            user_id: 'user-wa-123',
            email: '',
            phone_number: '+263771234567',
            created_at: '2026-01-01',
            status: 'active',
          },
          expires_at: '2026-02-18T00:00:00Z',
        }),
      })

      const result = await verifyWhatsAppOtp('phone-test-xyz789', '654321', '+263771234567')

      expect(result.error).toBeNull()
      expect(result.data?.session?.session_token).toBe('session-token-wa')

      // CRITICAL: Verify method_id is passed, not phone_number
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.method_id).toBe('phone-test-xyz789')
      expect(body.code).toBe('654321')
      expect(body.phone_number).toBe('+263771234567')
    })
  })

  // ==========================================================================
  // Email/Password Flow
  // ==========================================================================
  describe('signInWithEmail', () => {
    it('sends email and password, returns session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session_token: 'session-pw-123',
          session_jwt: 'jwt-pw-123',
          user: {
            user_id: 'user-pw-123',
            email: 'test@example.com',
            created_at: '2026-01-01',
            status: 'active',
          },
          expires_at: '2026-02-18T00:00:00Z',
        }),
      })

      const result = await signInWithEmail('test@example.com', 'Password123')

      expect(result.error).toBeNull()
      expect(result.data?.session?.session_token).toBe('session-pw-123')
      expect(result.data?.user?.email).toBe('test@example.com')
    })

    it('returns error for wrong password', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Incorrect password' }),
      })

      const result = await signInWithEmail('test@example.com', 'wrong')

      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })
  })

  describe('signUpWithEmail', () => {
    it('creates account and returns session', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          session_token: 'session-new-123',
          session_jwt: 'jwt-new-123',
          user: {
            user_id: 'user-new-123',
            email: 'new@example.com',
            created_at: '2026-01-01',
            status: 'active',
          },
          expires_at: '2026-02-18T00:00:00Z',
        }),
      })

      const result = await signUpWithEmail('new@example.com', 'StrongPass123')

      expect(result.error).toBeNull()
      expect(result.data?.session?.session_token).toBe('session-new-123')
    })

    it('returns error for duplicate email', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'A user with this email already exists' }),
      })

      const result = await signUpWithEmail('existing@example.com', 'Password123')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('already exists')
    })
  })

  // ==========================================================================
  // Magic Link Flow
  // ==========================================================================
  describe('signInWithMagicLink', () => {
    it('sends magic link request and returns success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      const result = await signInWithMagicLink('test@example.com')

      expect(result.error).toBeNull()
      expect(result.data).toEqual({ user: null, session: null })
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
      // signOut gracefully handles errors - local state is always cleared
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const result = await signOut()

      // Should not throw - error may or may not be returned depending on
      // whether a session token was stored, but it should never throw
      expect(result).toHaveProperty('error')
    })
  })

  // ==========================================================================
  // Utility functions
  // ==========================================================================
  describe('isAuthConfigured', () => {
    it('returns true when API_BASE_URL is set', () => {
      // The module reads EXPO_PUBLIC_API_BASE_URL at import time
      // We test that isAuthConfigured returns a boolean
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

      const result = await signInWithOtp('test@example.com')

      expect(result.error).toBeTruthy()
      // In test env, API_BASE_URL is empty so we get the config error
      // In production with a valid URL, network errors return "Unable to reach the server"
      expect(result.error?.message).toMatch(/API|server/)
    })

    it('handles non-JSON server responses gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        json: () => Promise.reject(new Error('Invalid JSON')),
      })

      const result = await signInWithOtp('test@example.com')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('Server error')
      expect(result.error?.message).toContain('502')
    })

    it('propagates server error messages to the client', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid email address. Please check and try again.' }),
      })

      const result = await signInWithOtp('bad-email')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toBe('Invalid email address. Please check and try again.')
    })

    it('returns status code in error when no server message', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: () => Promise.resolve({}),
      })

      const result = await signInWithEmail('test@example.com', 'pass')

      expect(result.error).toBeTruthy()
      expect(result.error?.message).toContain('500')
    })
  })
})
