/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds to succeed even if there are type errors
    ignoreBuildErrors: true,
  },
  // Silence workspace root inference warnings by explicitly setting the root
  outputFileTracingRoot: __dirname,
  // Image configuration for external domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wixstatic.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // PWA configuration
  experimental: {
    webpackBuildWorker: true,
  },
};

module.exports = nextConfig;