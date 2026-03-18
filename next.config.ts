import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '8000' },
      { protocol: 'https', hostname: '**' },
    ],
  },
};

export default nextConfig;
