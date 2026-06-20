import type { NextConfig } from "next";

// Social Composer ships as a self-contained STATIC bundle inside the Futures
// Atlas site, served under /social-composer. A static export can't contain
// route handlers, so the three API routes (transmutate / img / vid) live in the
// host app at /api/social-composer/* — fetch() calls use absolute paths that hit
// the host server directly (basePath does NOT prefix fetch()).
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/social-composer",
  assetPrefix: "/social-composer",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
