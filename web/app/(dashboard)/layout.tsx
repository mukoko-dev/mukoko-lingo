import Link from 'next/link'

const navItems = [
  { href: '/learn', label: 'Learn', icon: '📚' },
  { href: '/chat', label: 'Shamwari', icon: '🐝' },
  { href: '/progress', label: 'Progress', icon: '📈' },
  { href: '/classes', label: 'Classes', icon: '🏫' },
  { href: '/profile', label: 'Profile', icon: '👤' },
]

const adminItems = [
  { href: '/admin/overview', label: 'Dashboard' },
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/phrases', label: 'Phrases' },
  { href: '/admin/moderation', label: 'Moderation' },
  { href: '/admin/guardrails', label: 'Guardrails' },
  { href: '/admin/standards', label: 'Standards' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/api-keys', label: 'API Keys' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-[var(--border)] bg-[var(--card)] lg:block">
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="border-b border-[var(--border)] px-6 py-4">
            <Link href="/" className="text-lg font-bold text-[var(--foreground)]">
              mukoko lingo
            </Link>
          </div>

          {/* Main nav */}
          <nav className="flex-1 px-3 py-4">
            <p className="mb-2 px-3 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
              Learn
            </p>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            ))}

            <p className="mb-2 mt-6 px-3 text-xs font-semibold uppercase text-[var(--muted-foreground)]">
              Admin
            </p>
            {adminItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="mb-1 flex items-center rounded-lg px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--muted)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
