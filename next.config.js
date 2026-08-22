/** @type {import('next').NextConfig} */

// Base URL of the Laravel API. Documents are proxied through this app so
// users only ever see URLs on the frontend domain.
const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://academy.veritas.edu.ng/'
).replace(/\/+$/, '');

const nextConfig = {
  // output: 'export', // Commented out due to dynamic routes
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        // Proxy student documents through this app: relative /api/nysc/documents/*
        // URLs returned by the backend are fetched same-origin and forwarded.
        source: '/api/nysc/documents/:path*',
        destination: `${API_BASE}/api/nysc/documents/:path*`,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
      };
      
      config.resolve.alias = {
        ...config.resolve.alias,
        'debug': require.resolve('./utils/debug-fallback.js'),
      };
    }
    return config;
  },
};

module.exports = nextConfig;
