/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Use an isolated build/export directory so builds don't collide with stale .next output.
  distDir: '.next-build',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
