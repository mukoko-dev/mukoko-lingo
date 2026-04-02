'use client'

import { useEffect, useState } from 'react'
import { phrasesApi } from '@/lib/api-client'

interface Phrase {
  id: string
  category: string
  english: string
  shona: string
  ndebele: string
  chinese: string
  difficulty: string
}

export default function LearnPage() {
  const [phrases, setPhrases] = useState<Phrase[]>([])
  const [category, setCategory] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const params: Record<string, string> = {}
      if (category) params.category = category
      const { data } = await phrasesApi.listPhrases(params)
      setPhrases(data || [])
      setLoading(false)
    }
    load()
  }, [category])

  const categories = ['greetings', 'family', 'shopping', 'food', 'directions', 'work', 'social', 'health']

  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--foreground)]">Learn Phrases</h1>
      <p className="mt-1 text-[var(--muted-foreground)]">Browse and learn phrases in multiple African languages</p>

      {/* Category filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          onClick={() => setCategory('')}
          className={`rounded-lg px-3 py-1.5 text-sm ${!category ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--muted)] text-[var(--foreground)]'}`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${category === cat ? 'bg-[var(--primary)] text-[var(--primary-foreground)]' : 'bg-[var(--muted)] text-[var(--foreground)]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Phrase grid */}
      {loading ? (
        <div className="mt-8 text-center text-[var(--muted-foreground)]">Loading phrases...</div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {phrases.map((phrase) => (
            <div key={phrase.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
              <div className="text-xs font-medium uppercase text-[var(--muted-foreground)]">{phrase.category}</div>
              <div className="mt-2 text-lg font-semibold text-[var(--foreground)]">{phrase.english}</div>
              <div className="mt-3 space-y-1.5">
                <LangRow flag="🇿🇼" label="Shona" text={phrase.shona} />
                <LangRow flag="🇿🇼" label="Ndebele" text={phrase.ndebele} />
                <LangRow flag="🇨🇳" label="Chinese" text={phrase.chinese} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LangRow({ flag, label, text }: { flag: string; label: string; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span>{flag}</span>
      <span className="w-16 text-[var(--muted-foreground)]">{label}</span>
      <span className="text-[var(--foreground)]">{text}</span>
    </div>
  )
}
