'use client'

import { useEffect, useState } from 'react'
import { standardsApi } from '@/lib/api-client'

export default function StandardsPage() {
  const [standards, setStandards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await standardsApi.listStandards()
      setStandards(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading standards...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">Learning Standards</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Proficiency levels and AI prompt templates</p>

      <div className="mt-6 space-y-3">
        {standards.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">{s.level}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${s.is_active ? 'bg-malachite-100 text-malachite-800' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
                {s.is_active ? 'Active' : 'Disabled'}
              </span>
            </div>
            <p className="mt-1 text-sm font-medium">{s.title}</p>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{s.description}</p>
            {s.vocabulary_range && (
              <p className="mt-2 text-xs text-[var(--muted-foreground)]">Vocabulary: {s.vocabulary_range}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
