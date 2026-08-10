/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.ticketm.net' },
      { protocol: 'https', hostname: '**.ticketmaster.com' },
      { protocol: 'https', hostname: '**.ticketmaster.in' },
      { protocol: 'https', hostname: 's1.ticketm.net' },
      { protocol: 'https', hostname: 'media.ticketmaster.com' },
      { protocol: 'https', hostname: '**.bushdrum.com' },
      { protocol: 'https', hostname: 'bushdrum.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.cloudfront.net' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.imgix.net' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: '**.scdn.co' },    ],
  },
  // Faster local starts on Windows
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
