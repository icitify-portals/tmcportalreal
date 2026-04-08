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
    ],
    unoptimized: true,
  },
};

export default withSerwist(nextConfig);
// Force restart
