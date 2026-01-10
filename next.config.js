/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable experimental features that cause issues
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