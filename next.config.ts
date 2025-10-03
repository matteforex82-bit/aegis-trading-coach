import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // TODO: Fix TypeScript errors and set to false before production
    // Known issues:
    // - ConnectionStatus component missing props definition
    // - Other component prop type mismatches
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  images: {
    unoptimized: false,
    domains: [],
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Configurazione ottimizzata per Vercel
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  // Webpack configuration ottimizzata
  webpack: (config, { dev, isServer }) => {
    // Ottimizzazioni per la produzione
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            default: false,
            vendors: false,
            // Chunk per le librerie vendor
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Chunk per il codice comune
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        }
      };
    }
    return config;
  },
  eslint: {
    // All ESLint React Hooks errors have been fixed
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
