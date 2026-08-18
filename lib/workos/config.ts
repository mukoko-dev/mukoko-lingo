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

/** Every accepted redirect ends here — nothing else on the app is a callback. */
const CALLBACK_PATH = '/auth/callback'

/**
 * Vercel branch previews, e.g.
 * mukoko-lingo-git-<branch>-nyuchi.vercel.app. Anchored at both ends and
 * restricted to the hostname label charset so it can only ever match a host
 * under this project on this Vercel team — a substring check would accept
 * `mukoko-lingo-.evil.com` or `evil.com/?x=-nyuchi.vercel.app`.
 */
const PREVIEW_HOST = /^mukoko-lingo-[a-z0-9-]+-nyuchi\.vercel\.app$/

/** Local dev servers (Expo web defaults to 8081, older SDKs to 19006). */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

/**
 * Whether a client-supplied redirect URI may be handed to WorkOS.
 *
 * `/api/auth/authorize` takes `redirect_uri` straight from the request body,
 * so without this check the app's only defence is the redirect list registered
 * on the WorkOS application. That list now contains a wildcard entry for branch
 * previews, which makes "the IdP will reject anything unexpected" a weaker
 * guarantee than it looks — an authorization code is what gets delivered to
 * whatever host wins, so validate locally too rather than relying on remote
 * configuration staying tight.
 */
export function isAllowedRedirectUri(uri: unknown): uri is string {
  if (typeof uri !== 'string' || uri === '') return false

  // Exact matches for the configured web/mobile targets, including the custom
  // scheme, which has no meaningful URL structure to validate.
  if (uri === WORKOS_REDIRECTS.WEB || uri === WORKOS_REDIRECTS.MOBILE) return true

  let parsed: URL
  try {
    parsed = new URL(uri)
  } catch {
    return false
  }

  if (parsed.pathname !== CALLBACK_PATH) return false
  // A query string or fragment on the redirect target is never something we
  // send, and is the shape used to smuggle extra parameters into the callback.
  if (parsed.search !== '' || parsed.hash !== '') return false
  // Credentials in the authority section can disguise the real host.
  if (parsed.username !== '' || parsed.password !== '') return false

  if (parsed.protocol === 'https:' && PREVIEW_HOST.test(parsed.hostname)) return true
  if (parsed.protocol === 'http:' && LOCAL_HOSTS.has(parsed.hostname)) return true

  return false
}
