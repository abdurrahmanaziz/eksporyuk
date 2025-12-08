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
  // Next.js 14 compatible config
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
