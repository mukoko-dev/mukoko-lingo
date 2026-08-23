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

describe('the production Vercel alias', () => {
  it('accepts the bare project hostname over https', () => {
    // The client derives its redirect from window.location.origin, so a
    // deployment reached on the alias rather than the custom domain would
    // otherwise be rejected before WorkOS ever saw it.
    expect(isAllowedRedirectUri('https://mukoko-lingo.vercel.app/auth/callback')).toBe(true)
  })

  it('still requires https and an exact hostname', () => {
    expect(isAllowedRedirectUri('http://mukoko-lingo.vercel.app/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://mukoko-lingo.vercel.app.evil.com/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://evil-mukoko-lingo.vercel.app/auth/callback')).toBe(false)
  })
})

describe('private LAN dev hosts', () => {
  it('accepts Expo web served on a machine network address', () => {
    expect(isAllowedRedirectUri('http://192.168.1.14:8081/auth/callback')).toBe(true)
    expect(isAllowedRedirectUri('http://10.0.0.7:8081/auth/callback')).toBe(true)
    expect(isAllowedRedirectUri('http://172.16.0.3:8081/auth/callback')).toBe(true)
  })

  it('holds the 172.16-172.31 boundary of the private range', () => {
    // 172.16.0.0/12 is private; the octets either side of it are public
    // routable space and must not be treated as a dev machine.
    expect(isAllowedRedirectUri('http://172.16.0.1:8081/auth/callback')).toBe(true)
    expect(isAllowedRedirectUri('http://172.31.255.254:8081/auth/callback')).toBe(true)
    expect(isAllowedRedirectUri('http://172.15.0.1:8081/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('http://172.32.0.1:8081/auth/callback')).toBe(false)
  })

  it('rejects public addresses and hosts that merely embed one', () => {
    expect(isAllowedRedirectUri('http://11.0.0.1:8081/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('http://193.168.1.1:8081/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('http://192.168.1.14.evil.com/auth/callback')).toBe(false)
    expect(isAllowedRedirectUri('https://evil.com/?a=http://192.168.1.14/auth/callback')).toBe(false)
  })
})
