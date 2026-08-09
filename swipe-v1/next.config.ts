import type { NextConfig } from "next";

// Swipe the Future, VERSION 1. Frozen at commit 772ebf5, the state of the game
// before the sector decks, the true/false rewrite and the public stats page.
// Kept as a draft project so the original is playable and comparable against v2,
// which asks a different question entirely (already happened, or not yet).
//
// Do not develop this. Changes belong in swipe-the-future/. If v1 ever needs a
// fix, it is almost certainly the wrong thing to fix.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/swipe-v1",
  assetPrefix: "/swipe-v1",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
