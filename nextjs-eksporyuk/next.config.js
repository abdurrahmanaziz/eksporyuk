/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Fix for Next.js 16 - use proper external packages config
  serverExternalPackages: ['prisma'],
  
  // Fix turbopack root for monorepo
  turbopack: {
    root: __dirname,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
