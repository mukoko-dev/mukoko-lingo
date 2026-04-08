import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mukoko Lingo',
  description: 'Learn African languages — for individuals, schools, and businesses',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--background)] font-sans antialiased">
        {children}
        <footer className="border-t border-[var(--border)] py-4 text-center text-xs text-[var(--muted-foreground)]">
          <p>mukoko lingo v0.0.1</p>
          <p className="mt-0.5">
            <a href="https://nyuchi.com" className="hover:underline">nyuchi africa</a>
          </p>
        </footer>
      </body>
    </html>
  )
}
