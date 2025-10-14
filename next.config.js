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
};

module.exports = nextConfig;