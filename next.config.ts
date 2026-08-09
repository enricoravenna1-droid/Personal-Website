import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // three ships untranspiled ESM examples; let Next handle them.
  transpilePackages: ["three"],
};

export default nextConfig;
