/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
  },
  async rewrites() {
    // Browser traffic stays on one origin; this address is server-side only.
    const backend = (process.env.HRM_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '')
    return [
      {
        source: '/api/:path*',
        destination: `${backend}/api/:path*`,
      },
      { source: '/sanctum/csrf-cookie', destination: `${backend}/sanctum/csrf-cookie` },
      { source: '/auth/doxa', destination: `${backend}/auth/doxa` },
      { source: '/auth/doxa/callback', destination: `${backend}/auth/doxa/callback` },
      { source: '/auth/doxa/:path*', destination: `${backend}/auth/doxa/:path*` },
    ]
  },
}

module.exports = nextConfig
