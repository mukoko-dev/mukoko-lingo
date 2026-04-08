'use client'

import { useEffect, useState } from 'react'
import { adminApi } from '@/lib/api-client'

interface Stats {
  total_users: number
  total_admins: number
  total_phrases: number
  total_progress_records: number
  total_bookmarks: number
  total_views: number
  active_users: number
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await adminApi.getStats()
      setStats(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <div className="text-[var(--muted-foreground)]">Loading dashboard...</div>
  }

  if (!stats) {
    return <div className="text-[var(--destructive)]">Failed to load stats. Check admin permissions.</div>
  }

  const cards = [
    { label: 'Total Users', value: stats.total_users, color: 'text-cobalt-600' },
    { label: 'Active (7d)', value: stats.active_users, color: 'text-malachite-700' },
    { label: 'Admins', value: stats.total_admins, color: 'text-tanzanite-600' },
    { label: 'Phrases', value: stats.total_phrases, color: 'text-cobalt-600' },
    { label: 'Progress Records', value: stats.total_progress_records, color: 'text-army-500' },
    { label: 'Bookmarks', value: stats.total_bookmarks, color: 'text-gold-500' },
    { label: 'Total Views', value: stats.total_views, color: 'text-terracotta-500' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Admin Dashboard</h1>
      <p className="mt-1 text-[var(--muted-foreground)]">Platform overview and key metrics</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="text-xs font-medium uppercase text-[var(--muted-foreground)]">{card.label}</div>
            <div className={`mt-2 text-3xl font-bold ${card.color}`}>
              {card.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
