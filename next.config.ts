import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // GitHub Pages 정적 배포용
  images: {
    unoptimized: true,
  },
  trailingSlash: true,

  // 성능 최적화
  compress: true,
  poweredByHeader: false, // X-Powered-By 헤더 제거 (보안)
};

export default nextConfig;
