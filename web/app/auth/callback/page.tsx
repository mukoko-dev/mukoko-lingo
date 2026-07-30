'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState('')

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get('code')
      const authError = searchParams.get('error_description') || searchParams.get('error')

      if (authError) {
        setError(authError)
        return
      }
      if (!code) {
        setError('No authorization code found. Please try signing in again.')
        return
      }

      const pendingJson = sessionStorage.getItem('workos_pending_auth')
      const pending = pendingJson ? JSON.parse(pendingJson) : null
      if (!pending?.code_verifier) {
        setError('Sign-in session expired. Please try again.')
        return
      }

      try {
        const res = await fetch(`${apiBase}/api/auth/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, code_verifier: pending.code_verifier }),
        })
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Sign-in failed')
          return
        }

        sessionStorage.removeItem('workos_pending_auth')
        localStorage.setItem('workos_access_token', data.access_token)
        localStorage.setItem('workos_refresh_token', data.refresh_token)
        router.push('/learn')
      } catch {
        setError('Network error. Please try again.')
      }
    }

    handleCallback()
  }, [searchParams, apiBase, router])

  return (
    <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      {error ? (
        <>
          <h1 className="text-lg font-semibold">Authentication failed</h1>
          <p className="mt-2 text-sm text-[var(--destructive)]">{error}</p>
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="mt-4 text-sm text-[var(--primary)] hover:underline"
          >
            Back to sign in
          </button>
        </>
      ) : (
        <>
          <h1 className="text-lg font-semibold">Signing you in...</h1>
          <p className="mt-2 text-sm text-[var(--muted-foreground)]">Please wait a moment</p>
        </>
      )}
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <Suspense fallback={null}>
        <AuthCallbackContent />
      </Suspense>
    </div>
  )
}
