import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  // Turbopack configuration
  turbopack: {
    // Standard Turbopack config
  },
  // Use webpack for now to avoid Prisma issues
  serverExternalPackages: ['@prisma/client'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'tmcng.net',
        port: '',
        pathname: '/uploads/**',
      },
    ],
    unoptimized: true,
  },
};

export default nextConfig;
// Force restart
