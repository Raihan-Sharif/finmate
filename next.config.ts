import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  // PWA Configuration
  async headers() {
    return [
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "supabase.co",
      },
      {
        protocol: "https",
        hostname: "github.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },

  // Bundle analyzer
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Performance optimizations
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            common: {
              minChunks: 2,
              chunks: "all",
              name: "common",
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }

    return config;
  },

  // SEO and performance
  poweredByHeader: false,
  compress: true,

  // Security headers
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/overview",
        permanent: true,
      },
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
