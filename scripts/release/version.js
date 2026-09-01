/**
 * Version arithmetic for the automated release.
 *
 * Releases are cut from Conventional Commit subjects (CONTRIBUTING.md), so the
 * bump is derived, never typed by hand. Pure functions, no I/O — the CLI in
 * `prepare-release.js` does the reading and writing.
 */

/** Commit types that move the version, and how far. */
const TYPE_BUMPS = {
  feat: 'minor',
  fix: 'patch',
  perf: 'patch',
  refactor: 'patch',
  revert: 'patch',
  security: 'patch',
  // Everything else — docs, chore, ci, test, style, build — ships no user
  // visible change and cuts no release on its own.
}

const RANK = { none: 0, patch: 1, minor: 2, major: 3 }

/**
 * `type(scope)!: subject` → the bump it asks for.
 *
 * An unrecognised subject counts as `none` rather than `patch`: a release that
 * fires on "Merge branch 'main'" is worse than one a maintainer has to trigger
 * by hand (`workflow_dispatch`), and the workflow logs every classification.
 */
function classifyCommit(message) {
  if (typeof message !== 'string' || !message.trim()) return 'none'

  const [subject, ...rest] = message.split('\n')
  const body = rest.join('\n')

  // A `BREAKING CHANGE:` footer outranks whatever the subject says.
  if (/^BREAKING[ -]CHANGE:/m.test(body)) return 'major'

  const match = subject.match(/^([a-zA-Z]+)(\([^)]*\))?(!)?:/)
  if (!match) return 'none'

  const [, type, , bang] = match
  if (bang) return 'major'

  return TYPE_BUMPS[type.toLowerCase()] || 'none'
}

/** The largest bump any commit in the set asks for. */
function aggregateBump(messages) {
  let winner = 'none'
  for (const message of messages) {
    const bump = classifyCommit(message)
    if (RANK[bump] > RANK[winner]) winner = bump
  }
  return winner
}

function parseVersion(version) {
  const match = String(version).trim().match(/^v?(\d+)\.(\d+)\.(\d+)/)
  if (!match) throw new Error(`Not a semver version: ${version}`)
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) }
}

/**
 * Apply a bump.
 *
 * Below 1.0.0 a breaking change lands as a minor. Semver already says anything
 * may break in 0.x, and letting an automated job declare 1.0 would make a
 * product decision on a commit message's say-so.
 */
function nextVersion(current, bump) {
  const { major, minor, patch } = parseVersion(current)
  if (bump === 'none') return null
  if (bump === 'major') {
    return major === 0 ? `0.${minor + 1}.0` : `${major + 1}.0.0`
  }
  if (bump === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

/** Compare two semver strings: -1, 0 or 1. */
function compareVersions(a, b) {
  const left = parseVersion(a)
  const right = parseVersion(b)
  for (const part of ['major', 'minor', 'patch']) {
    if (left[part] !== right[part]) return left[part] < right[part] ? -1 : 1
  }
  return 0
}

/**
 * The version a release should be counted from.
 *
 * Normally the two agree: the release job bumps `package.json` in the same
 * commit it tags. They diverge when the bump cannot be pushed — branch
 * protection rejecting the bot, say — leaving a published tag ahead of the
 * files. Taking the newer of the two keeps the next release moving forward
 * instead of re-cutting a version that has already shipped.
 */
function baseVersion(tag, packageVersion) {
  if (!tag) return packageVersion
  const tagVersion = String(tag).replace(/^v/, '')
  return compareVersions(tagVersion, packageVersion) > 0 ? tagVersion : packageVersion
}

module.exports = {
  classifyCommit,
  aggregateBump,
  nextVersion,
  parseVersion,
  compareVersions,
  baseVersion,
  TYPE_BUMPS,
}
