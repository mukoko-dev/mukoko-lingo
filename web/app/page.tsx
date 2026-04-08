import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero */}
      <header className="flex flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] sm:text-6xl">
          Learn African Languages
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-[var(--muted-foreground)]">
          Mukoko Lingo helps individuals, schools, and businesses learn Shona,
          Ndebele, Chinese, and more — with AI-powered tutoring by Shamwari.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/learn"
            className="rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-[var(--primary-foreground)] shadow-sm hover:opacity-90"
          >
            Start Learning
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--muted)]"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="mx-auto grid max-w-5xl gap-8 px-6 pb-24 sm:grid-cols-3">
        <FeatureCard
          title="Phrase Learning"
          description="230+ phrases in 4 languages with pronunciation guides and cultural context."
          icon="📚"
        />
        <FeatureCard
          title="Shamwari AI Tutor"
          description="Your friendly AI language companion adapts to your skill level."
          icon="🐝"
        />
        <FeatureCard
          title="Schools & Classes"
          description="Teachers create classes, assign phrases, and track student progress."
          icon="🏫"
        />
      </section>
    </div>
  )
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-sm">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-3 text-lg font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted-foreground)]">{description}</p>
    </div>
  )
}
