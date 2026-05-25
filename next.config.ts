import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["leaflet", "maplibre-gl", "three"]
  }
};

export default nextConfig;
