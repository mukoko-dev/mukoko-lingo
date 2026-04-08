'use client'

import { useEffect, useState } from 'react'
import { adminUsersApi } from '@/lib/api-client'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)

  async function loadUsers() {
    setLoading(true)
    const params: Record<string, string> = {}
    if (roleFilter) params.role = roleFilter
    const { data } = await adminUsersApi.listUsers(params)
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [roleFilter])

  async function toggleRole(id: string, currentRole: string) {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    await adminUsersApi.updateRole(id, newRole)
    loadUsers()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">User Management</h1>
      <div className="mt-4 flex gap-2">
        {['', 'user', 'admin'].map((r) => (
          <button key={r} onClick={() => setRoleFilter(r)}
            className={`rounded-lg px-3 py-1.5 text-sm capitalize ${roleFilter === r ? 'bg-[var(--primary)] text-white' : 'bg-[var(--muted)]'}`}>
            {r || 'All'}
          </button>
        ))}
      </div>
      {loading ? <p className="mt-6 text-[var(--muted-foreground)]">Loading...</p> : (
        <div className="mt-6 overflow-hidden rounded-xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)]">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {users.map((user) => (
                <tr key={user.id} className="bg-[var(--card)]">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.display_name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${user.role === 'admin' ? 'bg-tanzanite-100 text-tanzanite-800' : 'bg-cobalt-50 text-cobalt-700'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">{user.status}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggleRole(user.id, user.role)}
                      className="text-xs text-cobalt-600 hover:underline">
                      {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
