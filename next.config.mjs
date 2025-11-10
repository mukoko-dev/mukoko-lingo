/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript errors temporarily ignored for rapid development
  // TODO: Remove this and fix type errors before production
  typescript: {
    ignoreBuildErrors: true,
  },
  // Image optimization disabled for faster builds
  images: {
    unoptimized: true,
  },
}

export default nextConfig
