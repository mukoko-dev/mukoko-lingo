/**
 * The question bank must not reach the client bundle.
 *
 * It carries every `correctAnswer`. While it lived in `lib/data/`, the app
 * imported it to render and grade quizzes, so the answers shipped inside the
 * JavaScript: a learner who opened the bundle could pass any assessment.
 * Moving it under `api/_lib/` only helps as long as nothing client-side
 * imports it back — which is one careless auto-import away, and would fail no
 * type check and no other test.
 *
 * So this walks the source tree instead of trusting convention. It is a
 * bundling property, not a behavioural one; there is nothing to assert about
 * it at runtime.
 */

import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

/** Bundled into the app: anything here reaches a learner's device. */
const CLIENT_DIRECTORIES = ['app', 'components', 'lib', 'constants', 'web']

const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']
const SKIP_DIRECTORIES = new Set(['node_modules', '.expo', 'dist', 'build', '.next', 'coverage', '__tests__'])

const REPO_ROOT = join(__dirname, '..', '..', '..')

function sourceFiles(dir: string): string[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }

  const found: string[] = []
  for (const entry of entries) {
    if (SKIP_DIRECTORIES.has(entry)) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      found.push(...sourceFiles(full))
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      found.push(full)
    }
  }
  return found
}

describe('question bank isolation', () => {
  const clientFiles = CLIENT_DIRECTORIES.flatMap((dir) => sourceFiles(join(REPO_ROOT, dir)))

  it('finds the client source to check', () => {
    // Guards the guard: a broken path here would make every assertion vacuous.
    expect(clientFiles.length).toBeGreaterThan(50)
  })

  it('is not imported by anything that ships to a client', () => {
    const importers = clientFiles.filter((file) => {
      const source = readFileSync(file, 'utf8')
      return /from\s+['"][^'"]*question-bank['"]|require\(\s*['"][^'"]*question-bank['"]/.test(source)
    })

    expect(importers.map((f) => f.slice(REPO_ROOT.length + 1))).toEqual([])
  })

  it('leaves no copy of the old client-side module behind', () => {
    // `lib/data/assessment-questions.ts` was the file with the answers in it.
    // A re-added copy would restore the hole without touching this directory.
    const revived = clientFiles.filter((file) => file.endsWith(join('lib', 'data', 'assessment-questions.ts')))

    expect(revived).toEqual([])
  })
})
