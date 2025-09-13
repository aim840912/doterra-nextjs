import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 優化圖片格式
    formats: ['image/webp', 'image/avif'],
    
    // 響應式圖片尺寸設定
    deviceSizes: [640, 768, 1024, 1280, 1600],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // 遠端圖片來源
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
      // 添加其他可能的圖片來源
      {
        protocol: 'https',
        hostname: '*.doterra.com',
        port: '',
        pathname: '/**',
      },
    ],
    
    // 圖片快取設定
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 天
    
    // 危險的變更，但可以增加靈活性（謹慎使用）
    // unoptimized: false,
  },
  
  // 實驗性功能啟用
  experimental: {
    // 啟用 Web Assembly（如果需要圖片處理）
    // webpackBuildWorker: true,
    
    // 優化包導入
    optimizePackageImports: ['@/lib/image-utils'],
  },
  
  // 效能優化已在 Next.js 15 中預設啟用
  
  // 圖片相關的編譯設定
  webpack: (config) => {
    // 優化圖片處理
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg|webp|avif)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/images/',
          outputPath: 'static/images/',
          name: '[name].[hash].[ext]'
        }
      }
    });
    
    return config;
  },
};

export default nextConfig;
