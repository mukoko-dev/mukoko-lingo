/**
 * The documentation drift checker.
 *
 * This runs in CI and can fail a build, so its two failure modes both matter:
 * missing real drift, and crying wolf over a legitimate mention. Both are
 * regex behaviour, which is what these cases pin.
 */

const {
  collectEnvReads,
  collectDocumentedEnv,
  claimedSuiteCount,
  checkDocLinks,
  docFiles,
  RETIRED_TERMS,
} = require('../check-docs')

describe('collectEnvReads', () => {
  it('finds TypeScript and Python reads', () => {
    const found = collectEnvReads(`
      const token = process.env.CLOUDFLARE_API_TOKEN || ''
      uri = os.environ["MONGODB_URI"]
      key = os.environ.get('WORKOS_API_KEY')
    `)

    expect([...found].sort()).toEqual(['CLOUDFLARE_API_TOKEN', 'MONGODB_URI', 'WORKOS_API_KEY'])
  })

  it('ignores variables the runtime provides', () => {
    // Demanding these in .env.example would be noise a developer learns to skip.
    const found = collectEnvReads(`
      process.env.NODE_ENV
      process.env.GITHUB_OUTPUT
      process.env.VERCEL_URL
      process.env.CI
    `)

    expect([...found]).toEqual([])
  })

  it('does not treat a lowercase property as a variable', () => {
    expect([...collectEnvReads('process.envelope.thing')]).toEqual([])
  })
})

describe('collectDocumentedEnv', () => {
  it('counts commented-out optionals as documented', () => {
    // `# CLOUDFLARE_AI_GATEWAY_TOKEN=` is how the template marks an optional;
    // treating it as undocumented would make the check unfixable.
    const documented = collectDocumentedEnv(
      ['MONGODB_URI=mongodb://x', '# CLOUDFLARE_AI_GATEWAY_TOKEN=', '  # WORKERS_AI_MODEL=@cf/qwen/x'].join('\n')
    )

    expect([...documented].sort()).toEqual(['CLOUDFLARE_AI_GATEWAY_TOKEN', 'MONGODB_URI', 'WORKERS_AI_MODEL'])
  })

  it('ignores prose that merely mentions a name', () => {
    expect([...collectDocumentedEnv('Set MONGODB_URI to your cluster')]).toEqual([])
  })
})

describe('claimedSuiteCount', () => {
  it('reads the count out of the CLAUDE.md sentence', () => {
    expect(claimedSuiteCount('**Test Suites** (42 suites, 460 tests). Run ...')).toBe(42)
  })

  it('returns null when the claim is gone, so the check can say so', () => {
    expect(claimedSuiteCount('# CLAUDE.md\n\nNo claim here.')).toBeNull()
  })
})

describe('RETIRED_TERMS', () => {
  const dbRule = RETIRED_TERMS.find((rule) => rule.term instanceof RegExp)

  it('flags naming mukoko-lingo as the database', () => {
    expect(dbRule.term.test("DB_NAME = 'mukoko-lingo'")).toBe(true)
    expect(dbRule.term.test('MongoDB (database `mukoko-lingo`)')).toBe(true)
  })

  it('leaves the legitimate slug, surface id and hostname alone', () => {
    // These are all real, current uses — a checker that fails on them would be
    // switched off within a week.
    expect(dbRule.term.test("entity.entities, slug `mukoko-lingo`")).toBe(false)
    expect(dbRule.term.test("SURFACE_CONTEXT = 'mukoko-lingo'")).toBe(false)
    expect(dbRule.term.test('https://mukoko-lingo-git-foo.vercel.app')).toBe(false)
  })

  it('names a reason for every retired term', () => {
    for (const rule of RETIRED_TERMS) {
      expect(typeof rule.reason).toBe('string')
      expect(rule.reason.length).toBeGreaterThan(10)
      expect(Array.isArray(rule.allow)).toBe(true)
    }
  })
})

describe('checkDocLinks', () => {
  it('passes over the repository as it stands', () => {
    // This is the check running for real: every relative link in every tracked
    // document must resolve. It caught a README pointing at a deleted
    // ARCHITECTURE.md.
    expect(checkDocLinks(docFiles())).toEqual([])
  })

  it('ignores external and anchor-only links', () => {
    // Nothing here is ours to verify, and network checks do not belong in CI.
    expect(checkDocLinks(['README.md'])).toEqual([])
  })

  it('exempts the changelog, whose links are history', () => {
    // Released sections name documents as they existed then; rewriting them to
    // satisfy a link checker would falsify the record.
    expect(checkDocLinks(['CHANGELOG.md'])).toEqual([])
  })
})
