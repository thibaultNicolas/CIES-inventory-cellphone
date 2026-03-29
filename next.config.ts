import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disabled: was causing build-time prerender failures (blocking-route)
  // with Client Components + dynamic data access.
  cacheComponents: false,
  reactCompiler: true,
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "store.storeimages.cdn-apple.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
