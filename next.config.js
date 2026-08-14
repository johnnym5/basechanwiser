/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig = {
  output: isStaticExport ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  // When doing a static export, we ignore the API routes which require a server
  ...(isStaticExport ? {
    distDir: 'out',
    typescript: {
      ignoreBuildErrors: true, // Fail-safe for static tier
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  } : {})
};

module.exports = nextConfig;
