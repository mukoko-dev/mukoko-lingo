'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { classesApi } from '@/lib/api-client'

export default function ClassesPage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await classesApi.listClasses()
      setClasses(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading classes...</div>

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Classes</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{classes.length} classes</p>
        </div>
        <button className="rounded-xl bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white">
          Create Class
        </button>
      </div>

      {classes.length === 0 ? (
        <div className="mt-8 rounded-xl border border-[var(--border)] bg-[var(--card)] p-12 text-center">
          <p className="text-lg font-semibold">No classes yet</p>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">Create a class or ask your teacher for an invite code.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((cls: any) => (
            <Link key={cls.id} href={`/classes/${cls.id}`}>
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition hover:shadow-md">
                <h3 className="font-semibold">{cls.name}</h3>
                {cls.description && <p className="mt-1 text-sm text-[var(--muted-foreground)]">{cls.description}</p>}
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
                  <span>Role: {cls.my_role || 'student'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
