'use client'

import { useEffect, useState } from 'react'
import { apiKeysApi } from '@/lib/api-client'

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [newKeyName, setNewKeyName] = useState('')

  async function loadKeys() {
    const { data } = await apiKeysApi.listApiKeys()
    setKeys(data || [])
    setLoading(false)
  }

  useEffect(() => { loadKeys() }, [])

  async function createKey() {
    if (!newKeyName.trim()) return
    const { data } = await apiKeysApi.createApiKey({ name: newKeyName, organization_id: 'default' })
    if (data?.key) {
      alert(`API Key created. Save this — it won't be shown again:\n\n${data.key}`)
    }
    setNewKeyName('')
    loadKeys()
  }

  async function revokeKey(id: string) {
    if (!confirm('Revoke this API key?')) return
    await apiKeysApi.revokeApiKey(id)
    loadKeys()
  }

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading API keys...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">API Keys</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Manage programmatic access to the Lingo platform</p>

      {/* Create */}
      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="Key name (e.g. 'Production App')"
          className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm outline-none"
        />
        <button onClick={createKey} className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
          Create Key
        </button>
      </div>

      {/* List */}
      <div className="mt-6 space-y-3">
        {keys.map((k: any) => (
          <div key={k.id} className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div>
              <span className="font-medium">{k.name}</span>
              <span className="ml-3 font-mono text-xs text-[var(--muted-foreground)]">{k.key_prefix}</span>
              {!k.is_active && <span className="ml-2 text-xs text-[var(--destructive)]">Revoked</span>}
            </div>
            {k.is_active && (
              <button onClick={() => revokeKey(k.id)} className="text-xs text-[var(--destructive)] hover:underline">
                Revoke
              </button>
            )}
          </div>
        ))}
        {keys.length === 0 && <p className="text-sm text-[var(--muted-foreground)]">No API keys created yet.</p>}
      </div>
    </div>
  )
}
