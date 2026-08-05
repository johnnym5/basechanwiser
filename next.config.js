/** @type {import('next').NextConfig} */
const isStaticExport = process.env.NEXT_STATIC_EXPORT === '1' || process.env.NEXT_STATIC_EXPORT === 'true';

const nextConfig = {
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
  ...(isStaticExport ? { output: 'export' } : {}),
};

module.exports = nextConfig;
