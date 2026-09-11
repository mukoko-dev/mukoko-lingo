/**
 * The files that carry the version number, and how each one carries it.
 *
 * RELEASES.md used to list these and ask a human to keep them in step, which
 * is exactly the kind of bookkeeping that drifts. The release job writes them
 * from one source now; this module owns the per-file transform so each one can
 * be tested without touching the working tree.
 */

/** Files whose version must change — a miss here fails the release. */
const REQUIRED_FILES = ['package.json', 'web/package.json', 'app.json', 'constants/Version.ts']

/** Files that carry the version but must not block a release if reorganised. */
const OPTIONAL_FILES = [
  'package-lock.json',
  'web/package-lock.json',
  'RELEASES.md',
  'CLAUDE.md',
]

function bumpPackageJson(content, version) {
  const parsed = JSON.parse(content)
  parsed.version = version
  return `${JSON.stringify(parsed, null, 2)}\n`
}

function bumpPackageLock(content, version) {
  const parsed = JSON.parse(content)
  parsed.version = version
  // npm mirrors the root version into the "" package entry; leaving that stale
  // makes `npm ci` rewrite the lockfile on the next install.
  if (parsed.packages && parsed.packages['']) parsed.packages[''].version = version
  return `${JSON.stringify(parsed, null, 2)}\n`
}

function bumpAppJson(content, version) {
  const parsed = JSON.parse(content)
  if (!parsed.expo) throw new Error('app.json has no expo block')
  parsed.expo.version = version
  return `${JSON.stringify(parsed, null, 2)}\n`
}

function bumpVersionTs(content, version) {
  return content.replace(/(export const APP_VERSION = ')[^']*(')/, `$1${version}$2`)
}

function bumpReleasesMd(content, version, date) {
  let next = content.replace(/(### Current Version: )v?[\d.]+/, `$1${version}`)
  // Newest first, directly under the table header.
  //
  // RELEASES.md is Prettier-formatted, so the header and every row carry
  // padding to the widest cell in each column. Match the header loosely and
  // pad the row we insert to the same widths: an unpadded row would fail
  // `prettier --check` and markdownlint MD060 on the very next pull request.
  next = next.replace(
    /\|[ \t]*Version[ \t]*\|[ \t]*Date[ \t]*\|[ \t]*Highlights[ \t]*\|\r?\n\|[-:| \t]+\|\r?\n/,
    (block) => {
      const header = block.split('\n')[0]
      const widths = header
        .trim()
        .slice(1, -1)
        .split('|')
        .map((cell) => cell.length - 2)
      const cells = [version, date, 'See [CHANGELOG](CHANGELOG.md)']
      const row = `|${cells
        .map((cell, i) => ` ${cell.padEnd(Math.max(widths[i] || 0, cell.length))} `)
        .join('|')}|`
      return `${block}${row}\n`
    }
  )
  return next
}

function bumpClaudeMd(content, version, date) {
  return content.replace(/(\*\*Current Version\*\*: )v?[\d.]+.*/, `$1${version} (${date})`)
}

const TRANSFORMS = {
  'package.json': bumpPackageJson,
  'web/package.json': bumpPackageJson,
  'package-lock.json': bumpPackageLock,
  'web/package-lock.json': bumpPackageLock,
  'app.json': bumpAppJson,
  'constants/Version.ts': bumpVersionTs,
  'RELEASES.md': bumpReleasesMd,
  'CLAUDE.md': bumpClaudeMd,
}

/**
 * Apply `version` to one file's content.
 *
 * Returns the new content, or throws for an unknown file. A transform that
 * finds no marker returns the content unchanged — `prepare-release.js` decides
 * whether that is fatal (required file) or a warning (optional one).
 */
function applyVersion(file, content, version, date) {
  const transform = TRANSFORMS[file]
  if (!transform) throw new Error(`No version transform for ${file}`)
  return transform(content, version, date)
}

module.exports = { applyVersion, REQUIRED_FILES, OPTIONAL_FILES, TRANSFORMS }
