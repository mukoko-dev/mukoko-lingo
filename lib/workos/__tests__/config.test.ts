/**
 * Redirect URI allowlist.
 *
 * /api/auth/authorize takes `redirect_uri` straight from the request body and
 * hands it to WorkOS, and the redirect target is where the authorization code
 * gets delivered. These cases pin down what is accepted.
 */

import { isAllowedRedirectUri, WORKOS_REDIRECTS } from '../config'

describe('isAllowedRedirectUri', () => {
  it('accepts the configured web and mobile targets', () => {
    expect(isAllowedRedirectUri(WORKOS_REDIRECTS.WEB)).toBe(true)
    expect(isAllowedRedirectUri(WORKOS_REDIRECTS.MOBILE)).toBe(true)
  })

  it('accepts Vercel branch previews for this project', () => {
    expect(
      isAllowedRedirectUri('https://mukoko-lingo-git-some-branch-nyuchi.vercel.app/auth/callback')
    ).toBe(true)
    expect(
      isAllowedRedirectUri('https://mukoko-lingo-console-git-x-nyuchi.vercel.app/auth/callback')
    ).toBe(true)
  })

  it('accepts local dev servers', () => {
    expect(isAllowedRedirectUri('http://localhost:8081/auth/callback')).toBe(true)
    expect(isAllowedRedirectUri('http://127.0.0.1:19006/auth/callback')).toBe(true)
  })

  it('rejects hosts that merely contain the preview pattern', () => {
    // The whole point of anchoring the regex: a substring check would pass all
    // of these and hand the authorization code to an attacker's host.
    expect(isAllowedRedirectUri('https://mukoko-lingo-x-nyuchi.vercel.app.evil.com/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://evil.com/mukoko-lingo-x-nyuchi.vercel.app/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://notmukoko-lingo-x-nyuchi.vercel.app/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://mukoko-lingo-x-nyuchi.vercel.app.co/auth/callback')).toBe(false)
  })

  it('rejects credentials in the authority that disguise the real host', () => {
    expect(
      isAllowedRedirectUri('https://lingo.mukoko.com@evil.com/auth/callback')
    ).toBe(false)
  })

  it('rejects unrelated hosts and wrong paths', () => {
    expect(isAllowedRedirectUri('https://evil.com/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://lingo.mukoko.com/somewhere-else')).toBe(false)
  })

  it('rejects plaintext http for non-local hosts', () => {
    expect(isAllowedRedirectUri('http://mukoko-lingo-x-nyuchi.vercel.app/auth/callback')).toBe(false)
  })

  it('rejects query strings and fragments on the callback', () => {
    expect(isAllowedRedirectUri('https://lingo.mukoko.com/auth/callback?next=https://evil.com')).toBe(false)
    expect(isAllowedRedirectUri('https://lingo.mukoko.com/auth/callback#x')).toBe(false)
  })

  it('rejects non-string and empty input', () => {
    expect(isAllowedRedirectUri(undefined)).toBe(false)
    expect(isAllowedRedirectUri(null)).toBe(false)
    expect(isAllowedRedirectUri('')).toBe(false)
    expect(isAllowedRedirectUri({ toString: () => WORKOS_REDIRECTS.WEB })).toBe(false)
    expect(isAllowedRedirectUri('not a url')).toBe(false)
  })

  it('rejects other custom schemes', () => {
    expect(isAllowedRedirectUri('evilapp://auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('javascript:alert(1)')).toBe(false)
  })
})
