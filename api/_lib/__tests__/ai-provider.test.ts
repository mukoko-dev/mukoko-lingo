/**
 * Workers AI transport, configuration gate and circuit breaker.
 *
 * The module reads its credentials at import time, so each scenario resets the
 * registry and re-requires it with the env it wants.
 */

type ProviderModule = typeof import('../ai-provider')

const FULL_ENV = {
  CLOUDFLARE_ACCOUNT_ID: 'acct_test',
  CLOUDFLARE_API_TOKEN: 'cf_token_test',
  CLOUDFLARE_AI_GATEWAY_ID: 'lingo-gateway',
  CLOUDFLARE_AI_GATEWAY_TOKEN: undefined,
  WORKERS_AI_MODEL: undefined,
}

function loadProvider(env: Record<string, string | undefined>): ProviderModule {
  jest.resetModules()
  const previous = { ...process.env }
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod: ProviderModule = require('../ai-provider')
  process.env = previous
  return mod
}

function chatOk(text: string) {
  return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }] }) }
}

function httpFail(status: number) {
  return { ok: false, status, text: async () => `error ${status}` }
}

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('configuration gate', () => {
  it('needs both the account id and the API token', () => {
    expect(loadProvider(FULL_ENV).isAiConfigured()).toBe(true)

    // A token with no account has no URL to post to, and an account with no
    // token gets a 401 — neither is "configured".
    expect(
      loadProvider({ ...FULL_ENV, CLOUDFLARE_ACCOUNT_ID: undefined }).isAiConfigured()
    ).toBe(false)
    expect(loadProvider({ ...FULL_ENV, CLOUDFLARE_API_TOKEN: undefined }).isAiConfigured()).toBe(
      false
    )
  })

  it('throws AiNotConfiguredError rather than failing as an outage', async () => {
    const { completeChat, AiNotConfiguredError } = loadProvider({
      ...FULL_ENV,
      CLOUDFLARE_ACCOUNT_ID: undefined,
      CLOUDFLARE_API_TOKEN: undefined,
    })
    const fetchMock = jest.fn()
    global.fetch = fetchMock as any

    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toBeInstanceOf(
      AiNotConfiguredError
    )
    // The distinction matters to /api/ai/moderate, which must not treat a
    // missing credential as "the model checked this and it was fine".
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('transport wiring', () => {
  it('posts the OpenAI-compatible Workers AI shape with a Bearer token', async () => {
    const { completeChat, WORKERS_AI_MODEL } = loadProvider(FULL_ENV)
    const fetchMock = jest.fn().mockResolvedValue(chatOk('Mhoro!'))
    global.fetch = fetchMock as any

    const result = await completeChat({
      messages: [{ role: 'user', content: 'hi' }],
      system: 'be nice',
      maxTokens: 256,
    })

    expect(result).toEqual({ text: 'Mhoro!', provider: 'workers-ai', model: WORKERS_AI_MODEL })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(
      'https://api.cloudflare.com/client/v4/accounts/acct_test/ai/v1/chat/completions'
    )
    expect(init.headers.Authorization).toBe('Bearer cf_token_test')
    // The Anthropic transport is gone; nothing should still be sending its header.
    expect(init.headers['x-api-key']).toBeUndefined()

    const body = JSON.parse(init.body)
    expect(body.model).toBe('@cf/qwen/qwen3-30b-a3b-fp8')
    // OpenAI shape: the system prompt is a leading message, not a top-level field.
    expect(body.messages[0]).toEqual({ role: 'system', content: 'be nice' })
    expect(body.messages[1]).toEqual({ role: 'user', content: 'hi' })
    expect(body.system).toBeUndefined()
    expect(body.max_tokens).toBe(256)
  })

  it('routes through the AI Gateway when a gateway id is set, and past it when it is not', async () => {
    const withGateway = loadProvider(FULL_ENV)
    const fetchMock = jest.fn().mockResolvedValue(chatOk('ok'))
    global.fetch = fetchMock as any
    await withGateway.completeChat({ messages: [{ role: 'user', content: 'hi' }] })
    expect(fetchMock.mock.calls[0][1].headers['cf-aig-gateway-id']).toBe('lingo-gateway')

    // Unset gateway id must not send an empty header — Cloudflare rejects it,
    // which would turn a missing optional into a hard outage.
    const noGateway = loadProvider({ ...FULL_ENV, CLOUDFLARE_AI_GATEWAY_ID: undefined })
    const bareMock = jest.fn().mockResolvedValue(chatOk('ok'))
    global.fetch = bareMock as any
    await noGateway.completeChat({ messages: [{ role: 'user', content: 'hi' }] })
    expect(bareMock.mock.calls[0][1].headers['cf-aig-gateway-id']).toBeUndefined()
  })

  it('sends cf-aig-authorization only for an authenticated gateway', async () => {
    const authed = loadProvider({ ...FULL_ENV, CLOUDFLARE_AI_GATEWAY_TOKEN: 'aig_token' })
    const fetchMock = jest.fn().mockResolvedValue(chatOk('ok'))
    global.fetch = fetchMock as any
    await authed.completeChat({ messages: [{ role: 'user', content: 'hi' }] })
    expect(fetchMock.mock.calls[0][1].headers['cf-aig-authorization']).toBe('Bearer aig_token')

    const plain = loadProvider(FULL_ENV)
    const plainMock = jest.fn().mockResolvedValue(chatOk('ok'))
    global.fetch = plainMock as any
    await plain.completeChat({ messages: [{ role: 'user', content: 'hi' }] })
    expect(plainMock.mock.calls[0][1].headers['cf-aig-authorization']).toBeUndefined()
  })

  it('honours a WORKERS_AI_MODEL override', async () => {
    const { completeChat } = loadProvider({ ...FULL_ENV, WORKERS_AI_MODEL: '@cf/qwen/other' })
    const fetchMock = jest.fn().mockResolvedValue(chatOk('ok'))
    global.fetch = fetchMock as any

    const result = await completeChat({ messages: [{ role: 'user', content: 'hi' }] })

    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe('@cf/qwen/other')
    expect(result.model).toBe('@cf/qwen/other')
  })

  it('never posts to the retired Anthropic or Vercel gateway hosts', async () => {
    const { completeChat } = loadProvider(FULL_ENV)
    const fetchMock = jest.fn().mockResolvedValue(chatOk('ok'))
    global.fetch = fetchMock as any

    await completeChat({ messages: [{ role: 'user', content: 'hi' }] })

    for (const [url] of fetchMock.mock.calls) {
      // Compare the parsed host, not a substring of the URL.
      const { host } = new URL(url)
      expect(host).not.toBe('api.anthropic.com')
      expect(host).not.toBe('ai-gateway.vercel.sh')
    }
  })
})

describe('failure handling', () => {
  it('surfaces the provider status on the error', async () => {
    const { completeChat, AiUnavailableError, resetCircuits } = loadProvider(FULL_ENV)
    resetCircuits()
    global.fetch = jest.fn().mockResolvedValue(httpFail(429)) as any

    const error = await completeChat({ messages: [{ role: 'user', content: 'hi' }] }).catch((e) => e)

    expect(error).toBeInstanceOf(AiUnavailableError)
    expect(error.status).toBe(429)
  })

  it('reports a timeout as 504 rather than a generic 502', async () => {
    const { completeChat, resetCircuits } = loadProvider(FULL_ENV)
    resetCircuits()
    const abort = Object.assign(new Error('aborted'), { name: 'AbortError' })
    global.fetch = jest.fn().mockRejectedValue(abort) as any

    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject(
      { status: 504 }
    )
  })
})

describe('circuit breaker', () => {
  it('opens after three failures and stops calling the dead provider', async () => {
    const { completeChat, resetCircuits } = loadProvider(FULL_ENV)
    resetCircuits()
    global.fetch = jest.fn().mockResolvedValue(httpFail(500)) as any

    for (let i = 0; i < 3; i++) {
      await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow()
    }
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3)

    // Fourth attempt: the breaker is open, so no request goes out and the
    // caller gets 503 (retry later) instead of the provider's own status.
    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject(
      { status: 503 }
    )
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3)
  })

  it('closes again on a success', async () => {
    const { completeChat, resetCircuits } = loadProvider(FULL_ENV)
    resetCircuits()
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(httpFail(500))
      .mockResolvedValueOnce(httpFail(500))
      .mockResolvedValueOnce(chatOk('back'))
      .mockResolvedValue(httpFail(500))
    global.fetch = fetchMock as any

    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow()
    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow()
    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).resolves.toMatchObject(
      { text: 'back' }
    )

    // The two earlier failures must not carry over: one more failure should
    // fail normally, not trip the breaker at 3-of-a-lifetime.
    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject(
      { status: 500 }
    )
    expect(fetchMock).toHaveBeenCalledTimes(4)
  })
})
