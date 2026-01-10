/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Disable turbo by default to avoid workspace root issues
    turbo: {
      root: __dirname,
    },
  },
  // Use src directory for app
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    domains: ['localhost', 'eksporyuk.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http', 
        hostname: '**',
      },
    ],
  },
};

module.exports = nextConfig;