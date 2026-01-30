import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/gv-prakash',
  assetPrefix: '/gv-prakash/',
  images: {
    unoptimized: true, // Required for static export
  },
};

export default nextConfig;
