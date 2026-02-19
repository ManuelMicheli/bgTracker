import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: __dirname,
  },
  serverExternalPackages: ['xlsx', 'pdf-parse'],
};

export default nextConfig;
