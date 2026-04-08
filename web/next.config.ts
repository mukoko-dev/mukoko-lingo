import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // API routes are in the root /api directory (shared with mobile app)
  // The web app calls them via NEXT_PUBLIC_API_BASE_URL
  reactStrictMode: true,
}

export default nextConfig
