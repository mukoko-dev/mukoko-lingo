/**
 * Release version arithmetic.
 *
 * The bump is what decides whether a tag is cut at all, so the interesting
 * cases are the ones that must NOT release and the pre-1.0 breaking rule.
 */

const { classifyCommit, aggregateBump, nextVersion, compareVersions, baseVersion } = require('../version')

describe('classifyCommit', () => {
  it('maps the conventional types this repo uses', () => {
    expect(classifyCommit('feat(ai): add phrase search')).toBe('minor')
    expect(classifyCommit('fix(auth): unbreak sign-in')).toBe('patch')
    expect(classifyCommit('perf: memoize the phrase list')).toBe('patch')
    expect(classifyCommit('refactor(db): extract collection accessors')).toBe('patch')
  })

  it('does not release on housekeeping', () => {
    for (const subject of ['docs: update CLAUDE.md', 'chore: bump deps', 'ci: add lint job', 'test: cover the breaker', 'style: reformat']) {
      expect(classifyCommit(subject)).toBe('none')
    }
  })

  it('treats a bang and a BREAKING CHANGE footer as major', () => {
    expect(classifyCommit('feat(api)!: drop the v1 chat shape')).toBe('major')
    expect(classifyCommit('fix: tighten token checks\n\nBREAKING CHANGE: old tokens are rejected')).toBe('major')
  })

  it('ignores anything that is not a conventional subject', () => {
    // A merge commit or a hand-typed subject must not cut a release by itself.
    expect(classifyCommit("Merge branch 'main' into feature/x")).toBe('none')
    expect(classifyCommit('updated some files')).toBe('none')
    expect(classifyCommit('')).toBe('none')
    expect(classifyCommit(undefined)).toBe('none')
  })

  it('does not mistake a colon later in the subject for a type', () => {
    expect(classifyCommit('this is not conventional: really')).toBe('none')
  })
})

describe('aggregateBump', () => {
  it('takes the largest bump in the set', () => {
    expect(aggregateBump(['docs: readme', 'fix: a bug', 'feat: a feature'])).toBe('minor')
    expect(aggregateBump(['docs: readme', 'chore: deps'])).toBe('none')
    expect(aggregateBump(['fix: a bug', 'feat!: a breaking feature'])).toBe('major')
  })

  it('is none for an empty range', () => {
    expect(aggregateBump([])).toBe('none')
  })
})

describe('nextVersion', () => {
  it('bumps within a major series', () => {
    expect(nextVersion('1.4.2', 'patch')).toBe('1.4.3')
    expect(nextVersion('1.4.2', 'minor')).toBe('1.5.0')
    expect(nextVersion('1.4.2', 'major')).toBe('2.0.0')
  })

  it('keeps a pre-1.0 breaking change inside 0.x', () => {
    // Declaring 1.0 is a product decision, not something a `!` in a commit
    // subject gets to make.
    expect(nextVersion('0.0.1', 'major')).toBe('0.1.0')
    expect(nextVersion('0.3.7', 'major')).toBe('0.4.0')
  })

  it('returns null when nothing should be released', () => {
    expect(nextVersion('0.0.1', 'none')).toBeNull()
  })

  it('accepts a v-prefixed tag as the current version', () => {
    expect(nextVersion('v0.0.1', 'patch')).toBe('0.0.2')
  })

  it('rejects a non-semver current version rather than guessing', () => {
    expect(() => nextVersion('latest', 'patch')).toThrow(/semver/)
  })
})

describe('baseVersion', () => {
  it('uses the package version when the tag agrees with it', () => {
    expect(baseVersion('v0.1.0', '0.1.0')).toBe('0.1.0')
  })

  it('prefers the tag when the tag is ahead of the files', () => {
    // This is the real case that bit on the first automated release: branch
    // protection rejected the version-bump commit, so v0.1.0 shipped while
    // package.json still read 0.0.1. Counting from the files would have cut
    // 0.0.2 next — a version below one already published.
    expect(baseVersion('v0.1.0', '0.0.1')).toBe('0.1.0')
    expect(nextVersion(baseVersion('v0.1.0', '0.0.1'), 'patch')).toBe('0.1.1')
  })

  it('keeps the package version when the files are ahead of the tag', () => {
    // A hand-bumped file set is still the intent; never walk it backwards.
    expect(baseVersion('v0.1.0', '0.2.0')).toBe('0.2.0')
  })

  it('falls back to the package version when there is no tag', () => {
    expect(baseVersion(null, '0.0.1')).toBe('0.0.1')
    expect(baseVersion('', '0.0.1')).toBe('0.0.1')
  })
})

describe('compareVersions', () => {
  it('orders by major, then minor, then patch', () => {
    expect(compareVersions('1.0.0', '0.9.9')).toBe(1)
    expect(compareVersions('0.2.0', '0.10.0')).toBe(-1)
    expect(compareVersions('0.1.2', '0.1.2')).toBe(0)
    expect(compareVersions('v0.1.0', '0.1.0')).toBe(0)
  })
})
