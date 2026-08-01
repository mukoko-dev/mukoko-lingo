import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'react/no-unescaped-entities': 'off',
      'prefer-const': 'warn',
      // The standard "fetch data on mount" useEffect pattern, used
      // throughout the admin pages — flagged by eslint-config-next's new
      // React Compiler-readiness rule, which predates this codebase.
      // Worth revisiting, but out of scope for standing up CI.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    ignores: ['node_modules/**', '.next/**', 'out/**'],
  },
]

export default eslintConfig
