import type { NextConfig } from "next";
// Self-contained static export served inside Futures Atlas at /woodchipper.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/woodchipper",
  assetPrefix: "/woodchipper",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
