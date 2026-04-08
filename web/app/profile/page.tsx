'use client'

import { useEffect, useState } from 'react'
import { profilesApi } from '@/lib/api-client'

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await profilesApi.getMyProfile()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading profile...</div>
  if (!profile) return <div className="text-[var(--destructive)]">Please sign in to view your profile.</div>

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Profile</h1>

      <div className="mt-6 rounded-xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div className="space-y-4">
          <Field label="Email" value={profile.email} />
          <Field label="Display Name" value={profile.display_name || '—'} />
          <Field label="Role" value={profile.role} />
          <Field label="Status" value={profile.status} />
          <Field label="Preferred Language" value={profile.preferred_ui_language || 'en'} />
          <Field label="Member Since" value={new Date(profile.created_at).toLocaleDateString()} />
        </div>
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-[var(--muted-foreground)]">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
