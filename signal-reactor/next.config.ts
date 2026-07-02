import type { NextConfig } from "next";
// Self-contained static export inside Futures Atlas at /signal-reactor.
// Generation happens in the HOST app's route at /api/signal-reactor/generate
// (same origin), so no API key or server code lives in this bundle.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/signal-reactor",
  assetPrefix: "/signal-reactor",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
