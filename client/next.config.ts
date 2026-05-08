import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  experimental: {
    // Disable turbopack for production if it causes issues
  }
};

export default nextConfig;
