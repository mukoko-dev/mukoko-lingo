import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Serve the console app at /console so it can live at lingo.nyuchi.com/console
  // as a separate Vercel project with the same custom domain root.
  basePath: '/console',

  // API routes live in the parent repo's /api directory (Vercel serverless).
  // The web app reaches them via NEXT_PUBLIC_API_BASE_URL.
  reactStrictMode: true,
}

export default nextConfig
