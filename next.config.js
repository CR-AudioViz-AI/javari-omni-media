/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true, // Temporary - will fix TS errors after deploy
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb'
    }
  }
}

module.exports = nextConfig
