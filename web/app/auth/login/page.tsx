'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [methodId, setMethodId] = useState('')
  const [step, setStep] = useState<'email' | 'verify'>('email')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ''

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${apiBase}/api/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to send code')
        return
      }

      setMethodId(data.method_id)
      setStep('verify')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${apiBase}/api/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method_id: methodId, code }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid code')
        return
      }

      localStorage.setItem('stytch_session_token', data.session_token)
      router.push('/learn')
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] p-8">
        <h1 className="text-2xl font-bold text-center">Sign in to Mukoko Lingo</h1>
        <p className="mt-1 text-center text-sm text-[var(--muted-foreground)]">Learn African languages</p>

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
            >
              {loading ? 'Sending code...' : 'Send Sign-in Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-6 space-y-4">
            <p className="text-sm text-center text-[var(--muted-foreground)]">
              We sent a 6-digit code to <strong>{email}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                required
                maxLength={6}
                placeholder="123456"
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-center tracking-widest outline-none focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>

            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}

            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full rounded-lg bg-[var(--primary)] py-2.5 text-sm font-semibold text-[var(--primary-foreground)] disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <button
              type="button"
              onClick={() => { setStep('email'); setCode(''); setError('') }}
              className="w-full text-sm text-[var(--primary)] hover:underline"
            >
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
