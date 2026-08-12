/**
 * API base URL resolution.
 *
 * The web build is a static SPA served from the same Vercel deployment as
 * the `/api/*` serverless functions (see `vercel.json`), so the browser can
 * always reach the API on its own origin. `EXPO_PUBLIC_API_BASE_URL` is
 * therefore only *required* on native, where there is no origin to inherit.
 *
 * Resolved lazily on every call so a value injected after module load
 * (tests, dynamic config) is still picked up.
 */

import { Platform } from 'react-native'

/**
 * Base URL for `/api/*` requests — no trailing slash.
 *
 * Order: explicit `EXPO_PUBLIC_API_BASE_URL` → the browser's own origin on
 * web → empty string (native without configuration, callers decide).
 */
export function getApiBaseUrl(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL
  if (configured) return configured.replace(/\/+$/, '')

  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  return ''
}

/** True when API calls can be made — i.e. `getApiBaseUrl()` resolved to something. */
export function hasApiBaseUrl(): boolean {
  return getApiBaseUrl() !== ''
}
