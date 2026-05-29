import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV !== "production",
  exclude: [/^\/dashboard\/burial\/new/],
});

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
      {
        protocol: 'https',
        hostname: 's3.eu-west-1.wasabisys.com',
        port: '',
        pathname: '/tmcbackup/**',
      },
    ],
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
// Force restart
