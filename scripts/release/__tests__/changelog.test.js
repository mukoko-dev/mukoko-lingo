/**
 * CHANGELOG surgery.
 *
 * The release job rewrites this file unattended, so the properties that matter
 * are that nothing already published is disturbed and that an empty section
 * cannot produce a hollow release.
 */

const { cutRelease, sectionFromCommits } = require('../changelog')

const FILE = `# Changelog - Mukoko Lingo

Preamble text.

---

## [Unreleased]

### Fixed
- **auth**: unbreak sign-in

---

## [0.0.1] — 2026-04-08

### Added
- Initial release
`

describe('cutRelease', () => {
  it('moves the Unreleased body under a version heading', () => {
    const { changelog, notes, released } = cutRelease(FILE, { version: '0.1.0', date: '2026-09-01' })

    expect(released).toBe(true)
    expect(notes).toBe('### Fixed\n- **auth**: unbreak sign-in')
    expect(changelog).toContain('## [0.1.0] — 2026-09-01\n\n### Fixed\n- **auth**: unbreak sign-in')
    // A fresh, empty Unreleased section is left open above it.
    expect(changelog.indexOf('## [Unreleased]')).toBeLessThan(changelog.indexOf('## [0.1.0]'))
    expect(changelog).toContain('## [Unreleased]\n\n_Nothing yet._')
  })

  it('separates the new section from the one below it the way the file does', () => {
    // Both hand reconciliations produced `---` butted against the next
    // heading; every other boundary in the real file has a blank line.
    const { changelog } = cutRelease(FILE, { version: '0.1.0', date: '2026-09-01' })

    expect(changelog).toContain('---\n\n## [0.0.1]')
    expect(changelog).not.toContain('---\n## [')
  })

  it('leaves the already-published sections untouched', () => {
    const { changelog } = cutRelease(FILE, { version: '0.1.0', date: '2026-09-01' })

    expect(changelog).toContain('## [0.0.1] — 2026-04-08\n\n### Added\n- Initial release')
    expect(changelog.startsWith('# Changelog - Mukoko Lingo\n\nPreamble text.')).toBe(true)
    // Exactly one Unreleased heading survives the rewrite.
    expect(changelog.match(/## \[Unreleased\]/g)).toHaveLength(1)
  })

  it('is idempotent enough to run twice: the second cut has nothing to release', () => {
    const first = cutRelease(FILE, { version: '0.1.0', date: '2026-09-01' })
    const second = cutRelease(first.changelog, { version: '0.1.1', date: '2026-09-02' })

    expect(second.released).toBe(false)
    expect(second.changelog).toBe(first.changelog)
  })

  it('falls back to commit subjects when nobody wrote the section', () => {
    const empty = FILE.replace('### Fixed\n- **auth**: unbreak sign-in', '_Nothing yet._')

    const { notes, released } = cutRelease(empty, {
      version: '0.1.0',
      date: '2026-09-01',
      fallbackCommits: [
        { message: 'feat(ai): add phrase search', sha: 'abc1234def' },
        { message: 'docs: tidy the readme', sha: 'ffff000' },
      ],
    })

    expect(released).toBe(true)
    expect(notes).toBe('### Added\n- **ai**: add phrase search (`abc1234`)')
    // Housekeeping commits stay out of the notes.
    expect(notes).not.toContain('readme')
  })

  it('refuses to invent a release from nothing', () => {
    const empty = FILE.replace('### Fixed\n- **auth**: unbreak sign-in', '')

    expect(cutRelease(empty, { version: '0.1.0', fallbackCommits: [] }).released).toBe(false)
    expect(cutRelease(empty, { version: '0.1.0', fallbackCommits: [{ message: 'chore: deps' }] }).released).toBe(false)
  })

  it('throws when the file has no Unreleased section rather than appending blindly', () => {
    expect(() => cutRelease('# Changelog\n\n## [0.0.1]\n', { version: '0.1.0' })).toThrow(/Unreleased/)
  })
})

describe('sectionFromCommits', () => {
  it('groups by conventional type and routes security scopes to Security', () => {
    const section = sectionFromCommits([
      { message: 'feat: a feature', sha: '1111111' },
      { message: 'fix(db): a fix', sha: '2222222' },
      { message: 'perf: faster', sha: '3333333' },
      { message: 'fix(security): tighten token checks', sha: '4444444' },
      { message: 'not a conventional subject', sha: '5555555' },
    ])

    expect(section).toContain('### Added\n- a feature (`1111111`)')
    expect(section).toContain('### Changed\n- faster (`3333333`)')
    expect(section).toContain('### Fixed\n- **db**: a fix (`2222222`)')
    expect(section).toContain('### Security\n- tighten token checks (`4444444`)')
    expect(section).not.toContain('not a conventional subject')
  })

  it('returns an empty string when no commit qualifies', () => {
    expect(sectionFromCommits([{ message: 'ci: tweak workflow' }])).toBe('')
    expect(sectionFromCommits([])).toBe('')
  })
})
