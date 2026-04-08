'use client'

import { useEffect, useState } from 'react'
import { progressApi, skillsApi, studySessionsApi } from '@/lib/api-client'

export default function ProgressPage() {
  const [progress, setProgress] = useState<any[]>([])
  const [skills, setSkills] = useState<any[]>([])
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [p, s, ss] = await Promise.all([
        progressApi.getProgress(),
        skillsApi.getUserSkills(),
        studySessionsApi.getSessions(),
      ])
      setProgress(p.data || [])
      setSkills(s.data || [])
      setSessions(ss.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const mastered = progress.filter(p => p.status === 'mastered').length
  const practiced = progress.filter(p => p.status === 'practiced').length
  const learning = progress.filter(p => p.status === 'learning').length

  if (loading) return <div className="text-[var(--muted-foreground)]">Loading progress...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold">Your Progress</h1>

      {/* Stats cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Mastered" value={mastered} color="text-army-500" />
        <StatCard label="Practiced" value={practiced} color="text-cobalt-600" />
        <StatCard label="Learning" value={learning} color="text-gold-500" />
        <StatCard label="Study Sessions" value={sessions.length} color="text-tanzanite-600" />
      </div>

      {/* Skills */}
      <h2 className="mt-8 text-lg font-semibold">Skill Proficiency</h2>
      <div className="mt-3 space-y-3">
        {skills.map((s: any) => (
          <div key={s.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.skill?.name || 'Unknown'}</span>
              <span className="text-sm text-[var(--muted-foreground)]">{s.current_score}/100</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div className="h-full rounded-full bg-cobalt-500" style={{ width: `${s.current_score}%` }} />
            </div>
          </div>
        ))}
        {skills.length === 0 && (
          <p className="text-sm text-[var(--muted-foreground)]">Complete assessments to track your skill proficiency.</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
      <div className="text-xs font-medium uppercase text-[var(--muted-foreground)]">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${color}`}>{value}</div>
    </div>
  )
}
