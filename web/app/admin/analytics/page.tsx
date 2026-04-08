'use client'

import { useEffect, useState } from 'react'
import { analyticsApi } from '@/lib/api-client'

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await analyticsApi.getOverview()
      setOverview(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading analytics...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Platform engagement and learning metrics</p>

      {overview ? (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
          <pre className="text-sm text-[var(--foreground)]">{JSON.stringify(overview, null, 2)}</pre>
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center text-[var(--muted-foreground)]">
          Analytics endpoint not configured. Python analytics routes required.
        </div>
      )}
    </div>
  )
}
