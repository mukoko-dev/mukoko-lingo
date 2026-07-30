/**
 * WorkOS AuthKit Configuration
 *
 * Centralized constants for the Mukoko Lingo WorkOS AuthKit integration.
 * Redirect URIs for the hosted sign-in flow (web + mobile).
 */

export const WORKOS_REDIRECTS = {
  WEB: process.env.WORKOS_REDIRECT_URI_WEB || 'https://lingo.mukoko.com/auth/callback',
  MOBILE: process.env.WORKOS_REDIRECT_URI_MOBILE || 'mukokolingo://auth/callback',
} as const
