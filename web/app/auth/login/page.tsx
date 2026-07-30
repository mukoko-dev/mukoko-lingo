'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  async function handleContinue() {
    setLoading(true)
    setError('')

    try {
      const redirectUri = `${window.location.origin}/auth/callback`
      const res = await fetch(`${apiBase}/api/auth/authorize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redirect_uri: redirectUri }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to start sign-in')
        setLoading(false)
        return
      }

      sessionStorage.setItem('workos_pending_auth', JSON.stringify({ state: data.state, code_verifier: data.code_verifier }))
      window.location.href = data.url
    } catch {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="text-2xl font-bold text-center">Sign in to Mukoko Lingo</h1>
        <p className="mt-1 text-center text-sm text-[var(--muted-foreground)]">Learn African languages</p>

        {error && <p className="mt-4 text-center text-sm text-[var(--destructive)]">{error}</p>}

        <button
          type="button"
          onClick={handleContinue}
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
        >
          {loading ? 'Redirecting...' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
