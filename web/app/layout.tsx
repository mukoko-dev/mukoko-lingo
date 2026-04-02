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
      </body>
    </html>
  )
}
