import type { NextConfig } from "next";

// Swipe the Future ships as a self-contained STATIC export inside the Futures
// Atlas site, served under /swipe-the-future (same convention as social-composer
// and hollow-villages). basePath/assetPrefix let the host route its assets.
//
// In production the /api/swipe routes are served by the host app on the same
// origin, so the export just calls them. `next dev` here has no such routes, so
// the stats page and the deck builder would sit there failing. The dev-only
// rewrite below points them at the host's dev server instead. `output: export`
// does not support rewrites, so this is gated on NODE_ENV and never reaches a
// production build.
const isDev = process.env.NODE_ENV === "development";
const HOST_DEV = process.env.SWIPE_API_ORIGIN ?? "http://localhost:4301";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/swipe-the-future",
  assetPrefix: "/swipe-the-future",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  ...(isDev
    ? {
        output: undefined,
        async rewrites() {
          return [
            // basePath: false so these match at the origin root, which is where
            // the app actually fetches them from
            { source: "/api/:path*", destination: `${HOST_DEV}/api/:path*`, basePath: false as const },
            // the loft photo and the shared nav bundle also live on the host
            { source: "/projects/:file*", destination: `${HOST_DEV}/projects/:file*`, basePath: false as const },
            { source: "/atlas-nav.:ext", destination: `${HOST_DEV}/atlas-nav.:ext`, basePath: false as const },
          ];
        },
      }
    : {}),
};

export default nextConfig;
