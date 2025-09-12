import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/photo-*',
      },
      {
        protocol: 'https',
        hostname: 'media.doterra.com',
        port: '',
        pathname: '/tw/images/**',
      },
    ],
  },
};

export default nextConfig;
