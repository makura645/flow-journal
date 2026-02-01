import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  eslint: {
    // ESLintがインストールされていない場合はビルド時のチェックをスキップ
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
