import type { NextConfig } from 'next';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/auth/:path*',
        destination: `${BACKEND_URL}/api/auth/:path*`,
      },
      {
        source: '/api/users/:path*',
        destination: `${BACKEND_URL}/api/users/:path*`,
      },
      {
        source: '/api/battles/:path*',
        destination: `${BACKEND_URL}/api/battles/:path*`,
      },
    ];
  },
};

export default nextConfig;
