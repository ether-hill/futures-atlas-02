import type { NextConfig } from "next";
// Self-contained static export inside Futures Atlas at /quantum-dominance.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/quantum-dominance",
  assetPrefix: "/quantum-dominance",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
