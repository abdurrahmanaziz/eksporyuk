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
  
  // 🚀 Production Performance Optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true, // Enable gzip compression
  
  // Optimize production builds
  productionBrowserSourceMaps: false, // Faster builds, smaller bundles
  
  // Force standalone for Vercel
  output: 'standalone',
  
  // Fix CSS loading on Vercel
  trailingSlash: false,
  
  // CSS optimization for Vercel
  experimental: {
    ...nextConfig.experimental,
    optimizeCss: true,
    cssChunking: 'loose',
  },
  
  // Cache headers for static assets
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
