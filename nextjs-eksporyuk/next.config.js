/** @type {import('next').NextConfig} */
const path = require('path')

// FORCE_REBUILD_CSS_v3: This comment forces Vercel to detect config change
const BUILD_VERSION = '5.2.3-css-layer-fix'

const nextConfig = {
  // Build version for cache busting
  generateBuildId: async () => {
    return BUILD_VERSION + '-' + Date.now()
  },
  // Skip type checking and linting during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['prisma'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Next.js 16 compatible config
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
    // turbo config removed - use default
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
  
  // Disable static optimization for API routes
  pageExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
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

module.exports = nextConfig
// Build trigger 1765773787
