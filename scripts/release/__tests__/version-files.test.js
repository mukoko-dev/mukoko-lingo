/**
 * Per-file version transforms.
 *
 * These run unattended against real project files, so each case pins the exact
 * marker the transform depends on — if a file is reformatted in a way that
 * breaks the transform, this suite is where it shows up rather than in a
 * half-finished release.
 */

const fs = require('fs')
const path = require('path')
const { applyVersion, REQUIRED_FILES, OPTIONAL_FILES } = require('../version-files')

const repoRoot = path.join(__dirname, '..', '..', '..')
const read = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8')

describe('applyVersion', () => {
  it('sets the version in package.json without disturbing the rest', () => {
    const out = applyVersion('package.json', read('package.json'), '9.9.9', '2026-09-01')
    const parsed = JSON.parse(out)

    expect(parsed.version).toBe('9.9.9')
    expect(parsed.name).toBe('mukoko-lingo')
    expect(parsed.jest).toBeDefined()
    expect(out.endsWith('\n')).toBe(true)
  })

  it('mirrors the version into the lockfile root package entry', () => {
    const out = applyVersion('package-lock.json', read('package-lock.json'), '9.9.9')
    const parsed = JSON.parse(out)

    // npm rewrites the lockfile on install when these two disagree.
    expect(parsed.version).toBe('9.9.9')
    expect(parsed.packages[''].version).toBe('9.9.9')
  })

  it('writes expo.version, not a top-level version, in app.json', () => {
    const out = applyVersion('app.json', read('app.json'), '9.9.9')
    const parsed = JSON.parse(out)

    expect(parsed.expo.version).toBe('9.9.9')
    expect(parsed.version).toBeUndefined()
  })

  it('rewrites APP_VERSION in constants/Version.ts', () => {
    const out = applyVersion('constants/Version.ts', read('constants/Version.ts'), '9.9.9')

    expect(out).toContain("export const APP_VERSION = '9.9.9'")
    expect(out).toContain("export const APP_NAME = 'mukoko lingo'")
  })

  it('updates the current version and prepends a history row in RELEASES.md', () => {
    const out = applyVersion('RELEASES.md', read('RELEASES.md'), '9.9.9', '2026-09-01')

    expect(out).toContain('### Current Version: 9.9.9')
    // The table is Prettier-formatted, so the header carries padding. Find it
    // by shape rather than by an exact string.
    const rows = out.slice(out.search(/\|[ \t]*Version[ \t]*\|[ \t]*Date[ \t]*\|/)).split('\n')
    // Newest release sits directly under the header separator.
    const cells = rows[2].split('|').slice(1, -1).map((cell) => cell.trim())
    expect(cells).toEqual(['9.9.9', '2026-09-01', 'See [CHANGELOG](CHANGELOG.md)'])
    // ...padded to the same width as the header, so the row we write stays
    // clean under `prettier --check` and markdownlint MD060.
    expect(rows[2]).toHaveLength(rows[0].length)
  })

  it('updates the project status line in CLAUDE.md', () => {
    const out = applyVersion('CLAUDE.md', read('CLAUDE.md'), '9.9.9', '2026-09-01')

    expect(out).toContain('**Current Version**: 9.9.9 (2026-09-01)')
  })

  it('actually changes every file the release touches', () => {
    // The transforms are string replacements; a file that quietly stops
    // matching would otherwise release a stale version number.
    for (const file of [...REQUIRED_FILES, ...OPTIONAL_FILES]) {
      const before = read(file)
      expect(applyVersion(file, before, '9.9.9', '2026-09-01')).not.toBe(before)
    }
  })

  it('refuses an unknown file rather than silently skipping it', () => {
    expect(() => applyVersion('README.md', '# hi', '9.9.9')).toThrow(/No version transform/)
  })
})
