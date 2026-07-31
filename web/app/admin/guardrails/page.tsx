'use client'

import { useEffect, useState } from 'react'
import { guardrailsApi } from '@/lib/api-client'

export default function GuardrailsPage() {
  const [guardrails, setGuardrails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await guardrailsApi.listGuardrails()
      setGuardrails(data || [])
      setLoading(false)
    }
    load()
  }, [])

  async function toggleEnabled(id: string, isEnabled: boolean) {
    await guardrailsApi.updateGuardrail(id, { isEnabled: !isEnabled })
    const { data } = await guardrailsApi.listGuardrails()
    setGuardrails(data || [])
  }

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading guardrails...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">Content Guardrails</h1>
      <p className="text-sm text-[var(--muted-foreground)]">
        Shared platform AI safety policy (shamwari.guardrails). Core guardrails are platform-wide
        and can&apos;t be disabled here.
      </p>

      <div className="mt-6 space-y-3">
        {guardrails.map((g: any) => (
          <div key={g.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{g.name}</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">{g.description}</p>
                <div className="mt-2 flex gap-2 text-xs">
                  <span className="rounded bg-[var(--muted)] px-2 py-0.5">{g.category}</span>
                  {g.isCore && <span className="rounded bg-[var(--muted)] px-2 py-0.5">Core</span>}
                  <span className="rounded bg-[var(--muted)] px-2 py-0.5">Severity: {g.severity}</span>
                </div>
              </div>
              <button
                onClick={() => !g.isCore && toggleEnabled(g.id, g.isEnabled)}
                disabled={g.isCore}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${g.isEnabled ? 'bg-malachite-100 text-malachite-800' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'} ${g.isCore ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {g.isEnabled ? 'Active' : 'Disabled'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
