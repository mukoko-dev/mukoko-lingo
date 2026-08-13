/**
 * Provider routing and fallback.
 *
 * The module reads its credentials at import time, so each scenario resets the
 * registry and re-requires it with the env it wants.
 */

type ProviderModule = typeof import('../ai-provider')

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

function anthropicOk(text: string) {
  return { ok: true, status: 200, json: async () => ({ content: [{ type: 'text', text }] }) }
}

function gatewayOk(text: string) {
  return { ok: true, status: 200, json: async () => ({ choices: [{ message: { content: text } }] }) }
}

function httpFail(status: number) {
  return { ok: false, status, text: async () => `error ${status}` }
}

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const GATEWAY_URL = 'https://ai-gateway.vercel.sh/v1/chat/completions'

const originalFetch = global.fetch

afterEach(() => {
  global.fetch = originalFetch
  jest.restoreAllMocks()
})

describe('candidate routing', () => {
  const bothKeys = { ANTHROPIC_API_KEY: 'sk-ant-test', AI_GATEWAY_API_KEY: 'vck_test' }

  it('leads with Claude direct for the default case', () => {
    const { resolveCandidates, ANTHROPIC_MODEL } = loadProvider(bothKeys)
    expect(resolveCandidates('Shona', 'practice')[0]).toEqual({
      provider: 'anthropic',
      model: ANTHROPIC_MODEL,
    })
  })

  it('leads with Kimi for Chinese', () => {
    const { resolveCandidates, GATEWAY_KIMI_MODEL } = loadProvider(bothKeys)
    for (const language of ['Chinese', 'chinese', 'Mandarin', 'zh-CN']) {
      expect(resolveCandidates(language, 'practice')[0]).toEqual({
        provider: 'gateway',
        model: GATEWAY_KIMI_MODEL,
      })
    }
  })

  it('leads with Kimi for translation help in any language', () => {
    const { resolveCandidates, GATEWAY_KIMI_MODEL } = loadProvider(bothKeys)
    expect(resolveCandidates('Shona', 'translation_help')[0]).toEqual({
      provider: 'gateway',
      model: GATEWAY_KIMI_MODEL,
    })
  })

  it('always keeps a fallback behind the leader', () => {
    const { resolveCandidates } = loadProvider(bothKeys)
    expect(resolveCandidates('Chinese', 'practice').length).toBeGreaterThan(1)
    expect(resolveCandidates('Shona', 'practice').length).toBeGreaterThan(1)
  })

  it('drops candidates whose credential is missing', () => {
    const gatewayOnly = loadProvider({ ANTHROPIC_API_KEY: undefined, AI_GATEWAY_API_KEY: 'vck_test' })
    expect(gatewayOnly.resolveCandidates('Shona').every((c) => c.provider === 'gateway')).toBe(true)

    const anthropicOnly = loadProvider({ ANTHROPIC_API_KEY: 'sk-ant-test', AI_GATEWAY_API_KEY: undefined })
    expect(anthropicOnly.resolveCandidates('Chinese').every((c) => c.provider === 'anthropic')).toBe(true)

    const neither = loadProvider({ ANTHROPIC_API_KEY: undefined, AI_GATEWAY_API_KEY: undefined })
    expect(neither.resolveCandidates('Shona')).toEqual([])
    expect(neither.isAiConfigured()).toBe(false)
  })
})

describe('transport wiring', () => {
  it('sends the Anthropic key to Anthropic with x-api-key', async () => {
    const { completeChat } = loadProvider({ ANTHROPIC_API_KEY: 'sk-ant-test', AI_GATEWAY_API_KEY: undefined })
    const fetchMock = jest.fn().mockResolvedValue(anthropicOk('Mhoro!'))
    global.fetch = fetchMock as any

    const result = await completeChat({ messages: [{ role: 'user', content: 'hi' }], system: 'be nice' })

    expect(result).toMatchObject({ text: 'Mhoro!', provider: 'anthropic' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(ANTHROPIC_URL)
    expect(init.headers['x-api-key']).toBe('sk-ant-test')
    expect(init.headers.Authorization).toBeUndefined()
    // Anthropic takes the system prompt as a top-level field.
    expect(JSON.parse(init.body).system).toBe('be nice')
  })

  it('sends the gateway key to the gateway as a Bearer token', async () => {
    const { completeChat, GATEWAY_KIMI_MODEL } = loadProvider({
      ANTHROPIC_API_KEY: undefined,
      AI_GATEWAY_API_KEY: 'vck_test',
    })
    const fetchMock = jest.fn().mockResolvedValue(gatewayOk('你好!'))
    global.fetch = fetchMock as any

    const result = await completeChat({
      messages: [{ role: 'user', content: 'hi' }],
      system: 'be nice',
      language: 'Chinese',
    })

    expect(result).toMatchObject({ text: '你好!', provider: 'gateway', model: GATEWAY_KIMI_MODEL })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(GATEWAY_URL)
    expect(init.headers.Authorization).toBe('Bearer vck_test')
    expect(init.headers['x-api-key']).toBeUndefined()
    // OpenAI shape: the system prompt is a leading message.
    const body = JSON.parse(init.body)
    expect(body.messages[0]).toEqual({ role: 'system', content: 'be nice' })
    expect(body.model).toBe(GATEWAY_KIMI_MODEL)
  })

  it('never sends a gateway key to Anthropic when only the gateway is configured', async () => {
    const { completeChat } = loadProvider({ ANTHROPIC_API_KEY: undefined, AI_GATEWAY_API_KEY: 'vck_test' })
    const fetchMock = jest.fn().mockResolvedValue(gatewayOk('ok'))
    global.fetch = fetchMock as any

    await completeChat({ messages: [{ role: 'user', content: 'hi' }] })

    for (const [url] of fetchMock.mock.calls) {
      // Compare the parsed host, not a substring of the URL.
      expect(new URL(url).host).not.toBe('api.anthropic.com')
    }
  })
})

describe('fallback', () => {
  it('falls through to the next provider when the leader fails', async () => {
    const { completeChat } = loadProvider({ ANTHROPIC_API_KEY: 'sk-ant-test', AI_GATEWAY_API_KEY: 'vck_test' })
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(httpFail(500))
      .mockResolvedValueOnce(gatewayOk('fallback answer'))
    global.fetch = fetchMock as any

    const result = await completeChat({ messages: [{ role: 'user', content: 'hi' }] })

    expect(result).toMatchObject({ text: 'fallback answer', provider: 'gateway' })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('falls back to Claude when Kimi is down for a Chinese request', async () => {
    const { completeChat } = loadProvider({ ANTHROPIC_API_KEY: 'sk-ant-test', AI_GATEWAY_API_KEY: 'vck_test' })
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(httpFail(503))
      .mockResolvedValueOnce(anthropicOk('claude answer'))
    global.fetch = fetchMock as any

    const result = await completeChat({ messages: [{ role: 'user', content: 'hi' }], language: 'Chinese' })

    expect(result).toMatchObject({ text: 'claude answer', provider: 'anthropic' })
  })

  it('surfaces 429 as the status when every candidate is rate limited', async () => {
    const { completeChat, AiUnavailableError } = loadProvider({
      ANTHROPIC_API_KEY: 'sk-ant-test',
      AI_GATEWAY_API_KEY: 'vck_test',
    })
    global.fetch = jest.fn().mockResolvedValue(httpFail(429)) as any

    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toBeInstanceOf(
      AiUnavailableError
    )
    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({
      status: 429,
    })
  })

  it('throws AiNotConfiguredError rather than failing as an outage', async () => {
    const { completeChat, AiNotConfiguredError } = loadProvider({
      ANTHROPIC_API_KEY: undefined,
      AI_GATEWAY_API_KEY: undefined,
    })
    const fetchMock = jest.fn()
    global.fetch = fetchMock as any

    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toBeInstanceOf(
      AiNotConfiguredError
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('circuit breaker', () => {
  it('opens per candidate and stops calling the dead one', async () => {
    const { completeChat, resetCircuits } = loadProvider({
      ANTHROPIC_API_KEY: 'sk-ant-test',
      AI_GATEWAY_API_KEY: undefined,
    })
    resetCircuits()
    global.fetch = jest.fn().mockResolvedValue(httpFail(500)) as any

    for (let i = 0; i < 3; i++) {
      await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toThrow()
    }
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3)

    // Fourth attempt: the breaker is open, so no request goes out.
    await expect(completeChat({ messages: [{ role: 'user', content: 'hi' }] })).rejects.toMatchObject({
      status: 503,
    })
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(3)
  })

  it('keeps one candidate available when another has tripped', async () => {
    const { completeChat, resetCircuits } = loadProvider({
      ANTHROPIC_API_KEY: 'sk-ant-test',
      AI_GATEWAY_API_KEY: 'vck_test',
    })
    resetCircuits()

    // Anthropic always fails; the gateway always works. Match the endpoint
    // exactly — a substring test on the host would accept any URL merely
    // containing it (CodeQL js/incomplete-url-substring-sanitization).
    global.fetch = jest.fn().mockImplementation(async (url: string) =>
      url === ANTHROPIC_URL ? httpFail(500) : gatewayOk('still up')
    ) as any

    for (let i = 0; i < 5; i++) {
      const result = await completeChat({ messages: [{ role: 'user', content: 'hi' }] })
      expect(result).toMatchObject({ text: 'still up', provider: 'gateway' })
    }
  })
})
