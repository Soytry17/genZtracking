import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["gsap", "animejs"],
  },
};

export default nextConfig;
