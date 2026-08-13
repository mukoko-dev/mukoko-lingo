/**
 * Native half of the AuthKit flow.
 *
 * The main suite runs the module as the web build, where sign-in is a
 * full-page navigation. Native still uses the custom scheme and
 * `openAuthSessionAsync`, so that path needs its own module instance with
 * Platform.OS mocked to a device.
 */

import * as WebBrowser from 'expo-web-browser'
import { signInWithAuthKit, getRedirectUri } from '../workos-client'

process.env.EXPO_PUBLIC_API_BASE_URL = 'https://test-api.mukoko.com'

const mockFetch = jest.fn()
global.fetch = mockFetch

const mockSecureStoreMemory = new Map<string, string>()
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn((key: string) => Promise.resolve(mockSecureStoreMemory.get(key) ?? null)),
  setItemAsync: jest.fn((key: string, value: string) => {
    mockSecureStoreMemory.set(key, value)
    return Promise.resolve()
  }),
  deleteItemAsync: jest.fn((key: string) => {
    mockSecureStoreMemory.delete(key)
    return Promise.resolve()
  }),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}))

jest.mock('expo-web-browser', () => ({
  openAuthSessionAsync: jest.fn(),
}))

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}))

describe('workos-client on native', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFetch.mockReset()
    mockSecureStoreMemory.clear()
  })

  it('keeps the deep-link scheme as the redirect URI', () => {
    expect(getRedirectUri()).toBe('mukokolingo://auth/callback')
  })

  it('opens an auth session and exchanges the returned code', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          url: 'https://auth.workos.com/authorize?client_id=abc',
          state: 'state-123',
          code_verifier: 'verifier-123',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'access-token-123',
          refresh_token: 'refresh-token-123',
          user: { user_id: 'user-123', email: 'test@example.com', created_at: '2026-01-01' },
        }),
      })

    ;(WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({
      type: 'success',
      url: 'mukokolingo://auth/callback?code=auth-code-123&state=state-123',
    })

    const result = await signInWithAuthKit()

    expect(result.error).toBeNull()
    expect(result.data?.session?.access_token).toBe('access-token-123')

    // The session is opened against the same URI the authorize call asked for.
    const authorizeBody = JSON.parse(mockFetch.mock.calls[0][1].body)
    expect(authorizeBody.redirect_uri).toBe('mukokolingo://auth/callback')
    expect(WebBrowser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://auth.workos.com/authorize?client_id=abc',
      'mukokolingo://auth/callback'
    )

    // The code exchange sends the persisted PKCE verifier, not the state.
    const exchangeBody = JSON.parse(mockFetch.mock.calls[1][1].body)
    expect(exchangeBody.code).toBe('auth-code-123')
    expect(exchangeBody.code_verifier).toBe('verifier-123')
  })

  it('returns no error when the user cancels the hosted sign-in', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ url: 'https://auth.workos.com/authorize', state: 's', code_verifier: 'v' }),
    })
    ;(WebBrowser.openAuthSessionAsync as jest.Mock).mockResolvedValueOnce({ type: 'cancel' })

    const result = await signInWithAuthKit()

    expect(result.error).toBeNull()
    expect(result.data).toBeNull()
  })
})
