/**
 * Stytch Configuration
 *
 * Centralized constants for the Mukoko Lingo Stytch integration.
 * Template IDs, redirect URLs, and session settings.
 *
 * Project: Mukoko Identity (Consumer / B2C)
 * Pattern: Direct Stytch integration (no Mukoko ID OAuth layer)
 */

// =============================================================================
// Email Template IDs (Mukoko Lingo branded — Cobalt buttons)
// =============================================================================

export const STYTCH_TEMPLATES = {
  LOGIN: process.env.STYTCH_TEMPLATE_LOGIN || undefined,
  SIGNUP: process.env.STYTCH_TEMPLATE_SIGNUP || undefined,
  RESET_PASSWORD: process.env.STYTCH_TEMPLATE_RESET_PASSWORD || undefined,
  OTP: process.env.STYTCH_TEMPLATE_OTP || undefined,
}

// =============================================================================
// Redirect URLs
// =============================================================================

export const STYTCH_REDIRECTS = {
  WEB: process.env.STYTCH_REDIRECT_URL_WEB || 'https://lingo.mukoko.com/auth/callback',
  MOBILE: process.env.STYTCH_REDIRECT_URL_MOBILE || 'mukokolingo://auth/callback',
} as const

// =============================================================================
// Session Configuration
// =============================================================================

const SESSION_DURATION_MINUTES_ENV = process.env.STYTCH_SESSION_DURATION_MINUTES
  ? parseInt(process.env.STYTCH_SESSION_DURATION_MINUTES, 10)
  : undefined

/** Session duration in minutes (default: 7 days = 10080 minutes) */
export const SESSION_DURATION_MINUTES = SESSION_DURATION_MINUTES_ENV || 10080

// =============================================================================
// OTP Configuration
// =============================================================================

/** OTP expiration in minutes */
export const OTP_EXPIRATION_MINUTES = 10
