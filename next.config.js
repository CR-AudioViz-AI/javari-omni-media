/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    domains: ['images.unsplash.com', 'cdn.craudiovizai.com'],
  },
}
module.exports = nextConfig
