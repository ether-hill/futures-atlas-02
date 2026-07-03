import type { NextConfig } from "next";
// Self-contained static export inside Futures Atlas at /quantum-spark.
// Generation happens in the HOST app's route at /api/quantum-spark/spark
// (same origin), so no API key or server code lives in this bundle.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/quantum-spark",
  assetPrefix: "/quantum-spark",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
