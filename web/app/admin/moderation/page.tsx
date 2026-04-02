'use client'

import { useEffect, useState } from 'react'
import { moderationApi } from '@/lib/api-client'

export default function ModerationPage() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)

  async function loadAlerts() {
    setLoading(true)
    const { data } = await moderationApi.listAlerts({ status: filter })
    setAlerts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadAlerts() }, [filter])

  async function handleResolve(id: string, status: string, notes?: string) {
    await moderationApi.updateAlert(id, { status, admin_notes: notes || '' })
    loadAlerts()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Content Moderation</h1>
      <p className="mt-1 text-[var(--muted-foreground)]">Review flagged content from app-level and org-level moderation</p>

      {/* Status filter */}
      <div className="mt-6 flex gap-2">
        {['pending', 'reviewed', 'resolved'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${filter === s ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--muted)] text-[var(--foreground)]'}`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mt-6 text-[var(--muted-foreground)]">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center text-[var(--muted-foreground)]">
          No {filter} alerts
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {alerts.map((alert) => (
            <div key={alert.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium uppercase text-[var(--muted-foreground)]">
                    {alert.content_type} — {alert.status}
                  </span>
                  <p className="mt-1 text-sm text-[var(--foreground)]">{alert.content_text}</p>
                  {alert.flagged_reason && (
                    <p className="mt-1 text-xs text-[var(--destructive)]">{alert.flagged_reason}</p>
                  )}
                </div>
                {alert.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResolve(alert.id, 'resolved', 'Approved')}
                      className="rounded-lg bg-malachite-600 px-3 py-1 text-xs text-white"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleResolve(alert.id, 'reviewed', 'Rejected')}
                      className="rounded-lg bg-[var(--destructive)] px-3 py-1 text-xs text-white"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
