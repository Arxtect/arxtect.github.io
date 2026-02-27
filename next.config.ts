import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  basePath: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_BASE_PATH
    : '',
  assetPrefix: process.env.NODE_ENV === 'production'
    ? process.env.NEXT_PUBLIC_BASE_PATH + '/'
    : '',
};

export default nextConfig;
