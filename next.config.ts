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
};

export default nextConfig;
// Force restart
