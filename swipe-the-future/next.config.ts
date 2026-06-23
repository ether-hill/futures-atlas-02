import type { NextConfig } from "next";

// Swipe the Future ships as a self-contained STATIC export inside the Futures
// Atlas site, served under /swipe-the-future (same convention as social-composer
// and hollow-villages). basePath/assetPrefix let the host route its assets.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/swipe-the-future",
  assetPrefix: "/swipe-the-future",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
