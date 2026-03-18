import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
