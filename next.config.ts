import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // futures-atlas-core ships TSX source; Next must transpile it.
  transpilePackages: ["futures-atlas-core"],

  // Both sub-projects are served from THIS deployment as self-contained static
  // bundles under public/ — no proxies, no separate Vercel projects. These
  // rewrites resolve the bundles' clean entry URLs to their index.html.
  //   • /hollow-villages/*        → Next static export (basePath baked in)
  //   • /underground-intelligence → single-page static app (client tab routing)
  // The UI :tab rewrite matches the four tab routes EXACTLY, so real assets at
  // /underground-intelligence/research/<file> still fall through to static.
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/hollow-villages", destination: "/hollow-villages/index.html" },
        { source: "/hollow-villages/oracle", destination: "/hollow-villages/oracle/index.html" },
        { source: "/hollow-villages/research", destination: "/hollow-villages/research/index.html" },
        { source: "/underground-intelligence", destination: "/underground-intelligence/index.html" },
        {
          source: "/underground-intelligence/:tab(story|dashboard|research)",
          destination: "/underground-intelligence/index.html",
        },
        { source: "/odds-of-surviving-ai", destination: "/odds-of-surviving-ai/index.html" },
        { source: "/odds-of-surviving-ai/research", destination: "/odds-of-surviving-ai/research.html" },
        // Quantum Sandbox — single-page Vite static app (base path baked in)
        { source: "/quantum-sandbox", destination: "/quantum-sandbox/index.html" },
        // Prism — Vite static app; the dashboard + a separate embed.html player
        { source: "/prism", destination: "/prism/index.html" },
        // Social Composer — Next static export (basePath baked in, trailingSlash)
        { source: "/social-composer", destination: "/social-composer/index.html" },
        { source: "/social-composer/about", destination: "/social-composer/about/index.html" },
      ],
    };
  },
};

export default nextConfig;
