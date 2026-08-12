/**
 * Tests for API base URL resolution.
 *
 * The web build ships the SPA and the `/api/*` functions in one Vercel
 * deployment, so an unset EXPO_PUBLIC_API_BASE_URL must not break web.
 */

import { Platform } from 'react-native'
import { getApiBaseUrl, hasApiBaseUrl } from '../api-base'

const ORIGINAL_ENV = process.env.EXPO_PUBLIC_API_BASE_URL
const ORIGINAL_LOCATION = (global as any).window?.location
const TEST_ORIGIN = 'https://lingo.example.com'

function setPlatform(os: string) {
  Object.defineProperty(Platform, 'OS', { value: os, configurable: true })
}

/** Stand in for a browser: the default test environment has no location. */
function setBrowserOrigin(origin: string | undefined) {
  if (typeof (global as any).window === 'undefined') (global as any).window = {}
  ;(global as any).window.location = origin ? { origin } : undefined
}

describe('getApiBaseUrl', () => {
  beforeEach(() => {
    setBrowserOrigin(TEST_ORIGIN)
  })

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = ORIGINAL_ENV
    setPlatform('web')
    setBrowserOrigin(undefined)
    if (ORIGINAL_LOCATION) (global as any).window.location = ORIGINAL_LOCATION
  })

  it('prefers an explicitly configured base URL', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com'
    expect(getApiBaseUrl()).toBe('https://api.example.com')
  })

  it('strips trailing slashes so `${base}/api/...` stays well-formed', () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.example.com//'
    expect(getApiBaseUrl()).toBe('https://api.example.com')
  })

  it('falls back to the browser origin on web when unset', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    setPlatform('web')
    expect(getApiBaseUrl()).toBe(TEST_ORIGIN)
    expect(hasApiBaseUrl()).toBe(true)
  })

  it('returns an empty string on native when unset', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    setPlatform('ios')
    expect(getApiBaseUrl()).toBe('')
    expect(hasApiBaseUrl()).toBe(false)
  })

  it('returns an empty string on web with no browser origin (SSR/export)', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    setPlatform('web')
    setBrowserOrigin(undefined)
    expect(getApiBaseUrl()).toBe('')
  })

  it('reads env lazily, so config injected after import is picked up', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL
    setPlatform('ios')
    expect(getApiBaseUrl()).toBe('')

    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://late.example.com'
    expect(getApiBaseUrl()).toBe('https://late.example.com')
  })
})
