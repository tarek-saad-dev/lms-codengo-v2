import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https' as const,
        hostname: 'img.clerk.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https' as const,
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      },
    ],
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['*']
    },
  },
  typescript: {
    // ✅ Ignore type errors during builds
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Ignore lint errors during builds
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*", // يمكنك تعيين "*" للسماح بجميع الأصول، أو تحديد النطاق الذي تريد السماح له
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
          {
            key: "Content-Range",
            value: "bytes 0-9/*", // تحديد نطاق المحتوى
          },
        ],
      },
    ];
  },
};

export default nextConfig satisfies NextConfig;
