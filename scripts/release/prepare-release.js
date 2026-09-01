#!/usr/bin/env node
/**
 * Prepare a release: work out the next version, bump every file that carries
 * it, and move the CHANGELOG's `[Unreleased]` section under a version heading.
 *
 * Writes nothing else — committing, tagging and publishing are the release
 * workflow's job (`.github/workflows/release.yml`), so this can be run locally
 * with `--dry-run` to see exactly what a merge to main would produce.
 *
 *   node scripts/release/prepare-release.js --dry-run
 *   node scripts/release/prepare-release.js --version 0.2.0 --notes-out notes.md
 *
 * Exits 0 with `release=false` when the commits since the last tag are all
 * housekeeping. That is a normal outcome, not a failure: not every merge is a
 * release.
 */

const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const { aggregateBump, nextVersion, classifyCommit, baseVersion } = require('./version')
const { cutRelease } = require('./changelog')
const { applyVersion, REQUIRED_FILES, OPTIONAL_FILES } = require('./version-files')

const repoRoot = path.join(__dirname, '..', '..')

// ASCII unit/record separators: a commit body contains newlines and can
// contain anything else, so the log format needs delimiters that cannot.
const FIELD = '\x1f'
const RECORD = '\x1e'

function git(args, options = {}) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8', ...options }).trim()
}

function parseArgs(argv) {
  const args = { dryRun: false, version: null, notesOut: null }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--version') args.version = argv[++i]
    else if (arg === '--notes-out') args.notesOut = argv[++i]
    else throw new Error(`Unknown argument: ${arg}`)
  }
  return args
}

function lastTag() {
  try {
    // stderr is silenced: "No names found" is the expected answer in a fresh
    // repository, not an error worth printing in the job log.
    return git(['describe', '--tags', '--abbrev=0', '--match', 'v*'], {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
  } catch {
    return null // No tags yet — the whole history is the range.
  }
}

function commitsSince(tag) {
  const range = tag ? `${tag}..HEAD` : 'HEAD'
  const raw = git(['log', range, `--format=%H${FIELD}%B${RECORD}`])
  return raw
    .split(RECORD)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [sha, message] = entry.split(FIELD)
      return { sha: sha.trim(), message: (message || '').trim() }
    })
    // The release job's own commit must not feed the next release.
    .filter((commit) => !/^chore\(release\)/.test(commit.message))
}

function setOutput(key, value) {
  if (!process.env.GITHUB_OUTPUT) return
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `${key}=${value}\n`)
}

function noRelease(reason) {
  console.log(`No release: ${reason}`)
  setOutput('release', 'false')
  setOutput('reason', reason)
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const readFile = (file) => fs.readFileSync(path.join(repoRoot, file), 'utf8')

  const packageVersion = JSON.parse(readFile('package.json')).version
  const previousTag = lastTag()
  const commits = commitsSince(previousTag)

  // The tag is authoritative when it is ahead: a release whose version-bump
  // commit could not be pushed (protected branch) leaves the files behind the
  // last published tag, and counting from the files would cut a version that
  // has already shipped.
  const currentVersion = baseVersion(previousTag, packageVersion)

  console.log(`Package version:  ${packageVersion}`)
  console.log(`Previous tag:     ${previousTag || '(none)'}`)
  console.log(`Counting from:    ${currentVersion}${currentVersion !== packageVersion ? ' (tag is ahead of the files)' : ''}`)
  console.log(`Commits in range: ${commits.length}`)
  for (const commit of commits) {
    const subject = commit.message.split('\n')[0]
    console.log(`  ${commit.sha.slice(0, 7)} [${classifyCommit(commit.message)}] ${subject}`)
  }

  if (commits.length === 0 && !args.version) return noRelease('no commits since the last tag')

  const bump = aggregateBump(commits.map((c) => c.message))
  const version = args.version || nextVersion(currentVersion, bump)
  if (!version) return noRelease(`nothing to release (largest bump: ${bump})`)

  const tag = `v${version}`
  if (git(['tag', '--list', tag])) {
    throw new Error(`Tag ${tag} already exists — refusing to overwrite a release`)
  }

  const date = new Date().toISOString().slice(0, 10)
  const { changelog, notes, released } = cutRelease(readFile('CHANGELOG.md'), {
    version,
    date,
    fallbackCommits: commits,
  })
  if (!released) return noRelease('CHANGELOG [Unreleased] is empty and no commit qualified')

  const writes = [['CHANGELOG.md', changelog]]

  for (const file of REQUIRED_FILES) {
    const before = readFile(file)
    const after = applyVersion(file, before, version, date)
    if (after === before) {
      throw new Error(`${file} was not rewritten to ${version} — its version marker moved`)
    }
    writes.push([file, after])
  }

  for (const file of OPTIONAL_FILES) {
    if (!fs.existsSync(path.join(repoRoot, file))) continue
    const before = readFile(file)
    const after = applyVersion(file, before, version, date)
    if (after === before) {
      console.warn(`Warning: ${file} was not updated — its version marker may have moved`)
      continue
    }
    writes.push([file, after])
  }

  console.log(`\nRelease ${tag} (${bump} bump from ${currentVersion})`)
  console.log(`Files: ${writes.map(([file]) => file).join(', ')}`)
  console.log(`\n--- release notes ---\n${notes}\n---------------------`)

  if (args.dryRun) {
    console.log('\nDry run — nothing written.')
    return
  }

  for (const [file, content] of writes) {
    fs.writeFileSync(path.join(repoRoot, file), content)
  }
  if (args.notesOut) fs.writeFileSync(args.notesOut, `${notes}\n`)

  setOutput('release', 'true')
  setOutput('version', version)
  setOutput('tag', tag)
  setOutput('bump', bump)
  setOutput('previous_tag', previousTag || '')
}

try {
  main()
} catch (error) {
  console.error(`Release preparation failed: ${error.message}`)
  process.exit(1)
}
