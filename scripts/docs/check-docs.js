#!/usr/bin/env node
/**
 * Documentation drift check.
 *
 * Docs rot silently: an env var gets renamed, a provider is swapped, a test
 * suite is added, and the guide keeps confidently describing the old thing.
 * The three checks here are the ones that have actually bitten this repo, and
 * each fails with the file to fix rather than a vague "docs are stale".
 *
 *   1. Every `process.env.X` read by shipped code appears in `.env.example`.
 *   2. Retired names (dead credentials, the invented `mukoko-lingo` database)
 *      do not reappear outside the history that legitimately mentions them.
 *   3. Relative markdown links resolve to a file that exists.
 *   4. The suite count CLAUDE.md claims matches the suites on disk.
 *
 *   node scripts/docs/check-docs.js
 *
 * Run by CI (`.github/workflows/ci.yml`) and by the docs-maintainer agent
 * (`.claude/agents/docs-maintainer.md`).
 */

const fs = require('fs')
const path = require('path')

const repoRoot = path.join(__dirname, '..', '..')

/** Provided by the runtime or the CI host — never ours to document. */
const RUNTIME_PROVIDED = new Set(['NODE_ENV', 'CI', 'TZ'])
const RUNTIME_PREFIXES = ['GITHUB_', 'VERCEL_', 'RUNNER_', 'npm_', 'EXPO_OS']

/**
 * Names that were removed and must not creep back into the docs.
 *
 * `allow` lists the files where the name is legitimate history — a changelog
 * entry describing the removal is not drift.
 */
const RETIRED_TERMS = [
  {
    term: 'ANTHROPIC_API_KEY',
    reason: 'inference moved to Cloudflare Workers AI (CLOUDFLARE_API_TOKEN)',
    allow: ['CHANGELOG.md', '.env.local.instructions', 'CLAUDE.md'],
  },
  {
    term: 'AI_GATEWAY_API_KEY',
    reason: 'the Vercel AI Gateway transport was removed',
    allow: ['CHANGELOG.md', '.env.local.instructions', 'CLAUDE.md'],
  },
  {
    term: 'ai-gateway.vercel.sh',
    reason: 'the Vercel AI Gateway transport was removed',
    allow: ['CHANGELOG.md', 'api/_lib/__tests__/ai-provider.test.ts'],
  },
  {
    term: 'EXPO_PUBLIC_ANTHROPIC_API_KEY',
    reason: 'no AI credential has ever belonged in the client bundle',
    allow: ['CHANGELOG.md'],
  },
  {
    // Deliberately narrow: `mukoko-lingo` is a legitimate entity slug, surface
    // id and Vercel hostname. Only naming it as the *database* is the error.
    term: /(?:DB_NAME\s*=\s*|database\s+)['"`]?mukoko-lingo/i,
    reason: 'the database is `lingo`; `mukoko-lingo` was an invented, never-populated one',
    allow: ['CHANGELOG.md', 'CLAUDE.md', 'docs/ECOSYSTEM_DATA_MIGRATION.md'],
  },
]

/** Files worth scanning for both env reads and retired names. */
const CODE_DIRS = ['api', 'lib', 'app', 'components', 'scripts', 'constants', 'web/app', 'web/lib']
const DOC_FILES = [
  'README.md',
  'CLAUDE.md',
  'SECURITY.md',
  'RELEASES.md',
  'CONTRIBUTING.md',
  'CHANGELOG.md',
  '.env.example',
  '.env.local.example',
  '.env.local.instructions',
]
const CODE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.py'])
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage', '.next', '.expo'])

function walk(dir, files = []) {
  const absolute = path.join(repoRoot, dir)
  if (!fs.existsSync(absolute)) return files
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const relative = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(relative, files)
    else if (CODE_EXTENSIONS.has(path.extname(entry.name))) files.push(relative)
  }
  return files
}

const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8')

/** `process.env.NAME` / `os.environ['NAME']` reads, minus runtime-provided ones. */
function collectEnvReads(contents) {
  const found = new Set()
  const patterns = [/process\.env\.([A-Z][A-Z0-9_]*)/g, /environ(?:\.get)?\(?\[?['"]([A-Z][A-Z0-9_]*)['"]/g]

  for (const pattern of patterns) {
    for (const match of contents.matchAll(pattern)) {
      const name = match[1]
      if (RUNTIME_PROVIDED.has(name)) continue
      if (RUNTIME_PREFIXES.some((prefix) => name.startsWith(prefix))) continue
      found.add(name)
    }
  }
  return found
}

/** Names assigned in a `.env` template, commented-out optionals included. */
function collectDocumentedEnv(envExample) {
  const found = new Set()
  for (const match of envExample.matchAll(/^\s*#?\s*([A-Z][A-Z0-9_]*)=/gm)) found.add(match[1])
  return found
}

/** The suite count CLAUDE.md claims, or null when it makes no claim. */
function claimedSuiteCount(claudeMd) {
  const match = claudeMd.match(/\*\*Test Suites\*\*\s*\((\d+)\s+suites/)
  return match ? Number(match[1]) : null
}

function checkEnv(codeFiles) {
  const documented = collectDocumentedEnv(read('.env.example'))
  const problems = []

  for (const file of codeFiles) {
    // Tests set fake env for their own purposes; that is not configuration.
    if (file.includes('__tests__') || file.includes('scripts/release') || file.includes('scripts/docs')) continue
    for (const name of collectEnvReads(read(file))) {
      if (!documented.has(name)) {
        problems.push(`${file} reads ${name}, which .env.example does not document`)
      }
    }
  }
  return problems
}

function checkRetiredTerms(files) {
  const problems = []
  for (const file of files) {
    // The checker and its tests name every retired term by definition.
    if (file.startsWith('scripts/docs/')) continue
    const contents = read(file)
    for (const { term, reason, allow } of RETIRED_TERMS) {
      if (allow.includes(file)) continue
      const hit = typeof term === 'string' ? contents.includes(term) : term.test(contents)
      if (hit) {
        problems.push(`${file} still mentions ${term} — ${reason}`)
      }
    }
  }
  return problems
}

/**
 * Relative markdown links that point at nothing.
 *
 * README linked to an ARCHITECTURE.md that had been deleted; a reader follows
 * that link once and stops trusting the index.
 */
function checkDocLinks(documents) {
  const problems = []
  for (const file of documents) {
    // Released changelog sections are history: they name documents as they
    // existed then, and rewriting them to keep a link checker happy would
    // falsify the record.
    if (file === 'CHANGELOG.md') continue
    const dir = path.dirname(file)
    for (const match of read(file).matchAll(/\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = match[1]
      if (/^(https?:|mailto:|#)/.test(target)) continue
      const withoutAnchor = target.split('#')[0]
      if (!withoutAnchor) continue
      if (!fs.existsSync(path.join(repoRoot, path.normalize(path.join(dir, withoutAnchor))))) {
        problems.push(`${file} links to ${target}, which does not exist`)
      }
    }
  }
  return problems
}

function checkSuiteCount(testFiles) {
  const claimed = claimedSuiteCount(read('CLAUDE.md'))
  if (claimed === null) return ['CLAUDE.md no longer states a test suite count']
  if (claimed !== testFiles.length) {
    return [`CLAUDE.md claims ${claimed} test suites; ${testFiles.length} exist on disk`]
  }
  return []
}

/** Every markdown document under docs/ and scripts/, plus the root set. */
function docFiles() {
  const extra = []
  for (const dir of ['docs', 'scripts']) {
    const absolute = path.join(repoRoot, dir)
    if (!fs.existsSync(absolute)) continue
    for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) extra.push(path.join(dir, entry.name))
    }
  }
  return [...DOC_FILES.filter((file) => fs.existsSync(path.join(repoRoot, file))), ...extra]
}

function main() {
  const codeFiles = CODE_DIRS.flatMap((dir) => walk(dir))
  // Match jest's default testMatch: any JS/TS file under a __tests__ directory
  // (StyledText-test.js is one of those), plus *.test.* / *.spec.* anywhere.
  const testFiles = codeFiles.filter(
    (file) =>
      /(^|\/)__tests__\//.test(file) ||
      /\.(test|spec)\.[jt]sx?$/.test(file)
  ).filter((file) => path.extname(file) !== '.py')
  const documents = docFiles()

  const checks = [
    ['Undocumented environment variables', checkEnv(codeFiles)],
    ['Retired names in docs and code', checkRetiredTerms([...documents, ...codeFiles])],
    ['Broken documentation links', checkDocLinks(documents)],
    ['Test suite count', checkSuiteCount(testFiles)],
  ]

  let failed = false
  for (const [name, problems] of checks) {
    if (problems.length === 0) {
      console.log(`ok   ${name}`)
      continue
    }
    failed = true
    console.log(`FAIL ${name}`)
    for (const problem of problems) console.log(`       ${problem}`)
  }

  if (failed) {
    console.log('\nDocs are out of step with the code. Fix the docs (or the check, if the')
    console.log('code is right and the rule has moved): scripts/docs/check-docs.js')
    process.exit(1)
  }
  console.log(`\nChecked ${codeFiles.length} code files and ${documents.length} documents.`)
}

if (require.main === module) main()

module.exports = {
  docFiles,
  checkDocLinks,
  collectEnvReads,
  collectDocumentedEnv,
  claimedSuiteCount,
  RETIRED_TERMS,
  RUNTIME_PROVIDED,
}
