/**
 * Access-token verification.
 *
 * `verifyAccessToken` exists because `decodeJwt` only base64-decodes a
 * payload, so acting on its output lets any caller hand-craft a token. Logout
 * additionally needs to revoke the session behind a token that has since
 * expired, which `allowExpired` permits — these cases pin down that the
 * relaxation covers expiry and nothing else.
 */

const mockJwtVerify = jest.fn()

jest.mock('jose', () => ({
  __esModule: true,
  // Deferred lookup: Babel hoists the import below above the const above.
  jwtVerify: (...a: any[]) => mockJwtVerify(...a),
  createRemoteJWKSet: () => 'JWKS',
}))

jest.mock('@workos-inc/node', () => ({
  __esModule: true,
  WorkOS: class {
    userManagement = { getJwksUrl: () => 'https://example.test/jwks' }
  },
}))

jest.mock('../../../lib/db/identity', () => ({
  __esModule: true,
  findOrCreatePersonFromWorkOS: jest.fn(),
}))

const ORIGINAL_ENV = process.env

/**
 * The module reads its WorkOS credentials into consts at import time, and a
 * static `import` here would be hoisted above any env setup — leaving the
 * client unconfigured so `getJwks()` throws before jose is ever reached. Load
 * it after the environment is in place instead.
 */
function loadVerifyAccessToken() {
  process.env = { ...ORIGINAL_ENV, WORKOS_API_KEY: 'sk_test', WORKOS_CLIENT_ID: 'client_test' }
  let mod: typeof import('../auth-middleware')
  jest.isolateModules(() => {
    // Deliberately require, not import: the load has to happen after the env
    // assignment above, and an import would be hoisted past it.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('../auth-middleware')
  })
  return mod!.verifyAccessToken
}

let verifyAccessToken: typeof import('../auth-middleware').verifyAccessToken

beforeEach(() => {
  verifyAccessToken = loadVerifyAccessToken()
})

afterAll(() => {
  process.env = ORIGINAL_ENV
})

function expiredError() {
  const err: any = new Error('"exp" claim timestamp check failed')
  err.code = 'ERR_JWT_EXPIRED'
  return err
}

describe('verifyAccessToken', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns the verified claims for a good token', async () => {
    mockJwtVerify.mockResolvedValue({ payload: { sub: 'u_1', sid: 'session_1' } })

    await expect(verifyAccessToken('tok')).resolves.toEqual({ sub: 'u_1', sid: 'session_1' })
  })

  it('rejects an empty token without calling out to jose', async () => {
    await expect(verifyAccessToken('')).resolves.toBeNull()
    expect(mockJwtVerify).not.toHaveBeenCalled()
  })

  it('does not tolerate expiry by default', async () => {
    mockJwtVerify.mockRejectedValue(expiredError())

    await expect(verifyAccessToken('tok')).resolves.toBeNull()
    expect(mockJwtVerify).toHaveBeenCalledTimes(1)
    // No second, more permissive attempt.
    expect(mockJwtVerify.mock.calls[0][2]).toBeUndefined()
  })

  it('retries an expired token with a clock tolerance when allowExpired is set', async () => {
    mockJwtVerify
      .mockRejectedValueOnce(expiredError())
      .mockResolvedValueOnce({ payload: { sid: 'session_1' } })

    await expect(verifyAccessToken('tok', { allowExpired: true })).resolves.toEqual({
      sid: 'session_1',
    })

    expect(mockJwtVerify).toHaveBeenCalledTimes(2)
    expect(mockJwtVerify.mock.calls[1][2]).toEqual({ clockTolerance: 30 * 24 * 60 * 60 })
  })

  it('still rejects a bad signature even with allowExpired', async () => {
    // The relaxation must widen the expiry window only. A forged token has to
    // stay unusable, otherwise logout would revoke arbitrary sessions.
    const bad: any = new Error('signature verification failed')
    bad.code = 'ERR_JWS_SIGNATURE_VERIFICATION_FAILED'
    mockJwtVerify.mockRejectedValue(bad)

    await expect(verifyAccessToken('forged', { allowExpired: true })).resolves.toBeNull()
    // Not retried: only ERR_JWT_EXPIRED gets a second chance.
    expect(mockJwtVerify).toHaveBeenCalledTimes(1)
  })

  it('returns null when even the tolerant retry fails', async () => {
    mockJwtVerify.mockRejectedValue(expiredError())

    await expect(verifyAccessToken('ancient', { allowExpired: true })).resolves.toBeNull()
    expect(mockJwtVerify).toHaveBeenCalledTimes(2)
  })
})
