/**
 * CHANGELOG surgery for the automated release.
 *
 * The `[Unreleased]` section is the source of truth: it is written by hand (or
 * by the docs agent) as the work lands, and the release job only moves it under
 * a version heading and opens a fresh one. Commit-derived entries are a
 * fallback for when nobody wrote anything, not the primary path — a generated
 * list of subjects is a worse changelog than a considered one.
 */

const UNRELEASED_HEADING = '## [Unreleased]'
const EMPTY_MARKER = '_Nothing yet._'

const GROUPS = [
  ['Added', ['feat']],
  ['Changed', ['perf', 'refactor', 'revert']],
  ['Fixed', ['fix']],
  ['Security', ['security']],
]

/** `fix(auth): unbreak sign-in` → `{ type, scope, subject }`, or null. */
function parseSubject(message) {
  const subject = String(message || '').split('\n')[0].trim()
  const match = subject.match(/^([a-zA-Z]+)(?:\(([^)]*)\))?!?:\s*(.+)$/)
  if (!match) return null
  return { type: match[1].toLowerCase(), scope: match[2] || null, subject: match[3].trim() }
}

/**
 * Build a changelog section from commits. `commits` are
 * `{ message, sha }` — the sha is rendered short so an entry stays traceable.
 */
function sectionFromCommits(commits) {
  const buckets = new Map(GROUPS.map(([name]) => [name, []]))

  for (const commit of commits || []) {
    const parsed = parseSubject(commit.message)
    if (!parsed) continue

    const group =
      parsed.scope === 'security'
        ? 'Security'
        : (GROUPS.find(([, types]) => types.includes(parsed.type)) || [])[0]
    if (!group) continue

    const sha = commit.sha ? ` (\`${String(commit.sha).slice(0, 7)}\`)` : ''
    const scope = parsed.scope && parsed.scope !== 'security' ? `**${parsed.scope}**: ` : ''
    buckets.get(group).push(`- ${scope}${parsed.subject}${sha}`)
  }

  return GROUPS.map(([name]) => [name, buckets.get(name)])
    .filter(([, entries]) => entries.length > 0)
    .map(([name, entries]) => `### ${name}\n${entries.join('\n')}`)
    .join('\n\n')
}

function findUnreleased(markdown) {
  const start = markdown.indexOf(UNRELEASED_HEADING)
  if (start === -1) return null

  const afterHeading = start + UNRELEASED_HEADING.length
  const next = markdown.slice(afterHeading).search(/\n## \[/)
  const end = next === -1 ? markdown.length : afterHeading + next + 1

  return { start, afterHeading, end, body: markdown.slice(afterHeading, end) }
}

/** Strip the `---` rule the file puts between version sections. */
function stripTrailingRule(body) {
  return body.replace(/\n+---\s*$/, '').trim()
}

/**
 * Move `[Unreleased]` under a version heading and open an empty one.
 *
 * Returns `{ changelog, notes, released }`. `released` is false when there is
 * nothing to release — an empty section and no usable fallback — and the
 * caller should skip the release rather than tag an empty version.
 */
function cutRelease(markdown, { version, date, fallbackCommits } = {}) {
  if (!version) throw new Error('cutRelease needs a version')
  const section = findUnreleased(markdown)
  if (!section) throw new Error(`CHANGELOG.md has no "${UNRELEASED_HEADING}" section`)

  const written = stripTrailingRule(section.body).replace(EMPTY_MARKER, '').trim()
  const notes = written || sectionFromCommits(fallbackCommits)

  if (!notes) return { changelog: markdown, notes: '', released: false }

  const heading = `## [${version}] — ${date || new Date().toISOString().slice(0, 10)}`
  // The trailing blank line matters: `section.end` lands on the next heading,
  // so without it the rule and that heading end up on consecutive lines, which
  // is not how the rest of the file separates versions.
  const rebuilt =
    `${UNRELEASED_HEADING}\n\n${EMPTY_MARKER}\n\n---\n\n${heading}\n\n${notes}\n\n---\n\n`

  const changelog = markdown.slice(0, section.start) + rebuilt + markdown.slice(section.end)
  return { changelog, notes, released: true }
}

module.exports = { cutRelease, sectionFromCommits, parseSubject, UNRELEASED_HEADING, EMPTY_MARKER }
