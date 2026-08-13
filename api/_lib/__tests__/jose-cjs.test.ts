/**
 * Regression guard for the auth outage caused by jose v6.
 *
 * Vercel builds `api/**` as CommonJS. jose v6 is pure ESM ("type": "module",
 * no `require` export), so `require('jose')` from the compiled
 * api/_lib/auth-middleware.js threw ERR_REQUIRE_ESM at module load and every
 * auth route returned FUNCTION_INVOCATION_FAILED — sign-in was fully down
 * while local dev and the test suite stayed green, because both resolve
 * jose through ESM.
 *
 * Nothing in a normal typecheck or unit run catches that, so assert the
 * CommonJS entry point directly: this fails the moment jose is bumped back
 * to an ESM-only major.
 */

describe('jose CommonJS interop', () => {
  it('publishes a require entry point', () => {
    const pkg = require('jose/package.json')
    expect(pkg.exports['.'].require).toBeTruthy()
    expect(pkg.type).not.toBe('module')
  })

  it('loads through require() the way the built serverless function does', () => {
    expect(() => require('jose')).not.toThrow()
  })

  it('exposes every jose export the auth routes import', () => {
    // api/_lib/auth-middleware.ts and api/auth/logout.ts
    const jose = require('jose')
    expect(typeof jose.createRemoteJWKSet).toBe('function')
    expect(typeof jose.jwtVerify).toBe('function')
    expect(typeof jose.decodeJwt).toBe('function')
  })
})
