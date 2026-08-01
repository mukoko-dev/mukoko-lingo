const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const globals = require('globals')

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'web/**', '.claude/worktrees/**', 'coverage/**', '.venv-ci-test/**'],
  },
  {
    // eslint-plugin-import's TypeScript resolver (bundled by
    // eslint-config-expo) doesn't understand this repo's TypeScript
    // version yet ("invalid interface loaded as resolver"). Module
    // resolution is already verified by `tsc --noEmit` in CI, so these
    // rules are redundant with — and currently broken by — that mismatch.
    rules: {
      'import/no-unresolved': 'off',
      'import/named': 'off',
      'import/namespace': 'off',
      'import/default': 'off',
      'import/export': 'off',
      'import/no-duplicates': 'off',
    },
  },
  {
    files: ['**/__tests__/**', '**/*.test.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: globals.jest,
    },
  },
  {
    // eslint-config-expo's React Compiler-readiness rule family
    // (react-hooks/refs, /set-state-in-effect, /immutability,
    // /preserve-manual-memoization) is new, strict, and flags real
    // patterns already throughout this codebase (e.g. animation refs in
    // XPBadge.tsx, the SSR-hydration setState-in-effect idiom in
    // useClientOnlyValue.web.ts) that predate React Compiler adoption.
    // Worth addressing, but out of scope for standing up CI — downgraded
    // to warnings so they stay visible without blocking the pipeline on
    // a codebase-wide refactor.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      // Purely cosmetic (unescaped apostrophes/quotes in JSX text), no
      // functional impact — common to disable outright rather than mass-
      // edit dozens of files' rendered copy for an HTML-entity preference.
      'react/no-unescaped-entities': 'off',
    },
  },
])
