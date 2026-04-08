'use client'

import { useEffect, useState } from 'react'
import { phrasesApi, adminPhrasesApi } from '@/lib/api-client'

export default function PhrasesAdminPage() {
  const [phrases, setPhrases] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function loadPhrases() {
    setLoading(true)
    const { data } = await phrasesApi.listPhrases()
    setPhrases(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPhrases() }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this phrase?')) return
    await adminPhrasesApi.deletePhrase(id)
    loadPhrases()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Phrase Management</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{phrases.length} phrases</p>
        </div>
        <button className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
          Add Phrase
        </button>
      </div>

      {loading ? <p className="mt-6 text-[var(--muted-foreground)]">Loading...</p> : (
        <div className="mt-6 space-y-3">
          {phrases.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div>
                <span className="text-xs font-medium uppercase text-[var(--muted-foreground)]">{p.category}</span>
                <p className="font-semibold">{p.english}</p>
                <p className="text-sm text-[var(--muted-foreground)]">{p.shona} · {p.ndebele} · {p.chinese}</p>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-cobalt-600 hover:underline">Edit</button>
                <button onClick={() => handleDelete(p.id)} className="text-xs text-[var(--destructive)] hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
