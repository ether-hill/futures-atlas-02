import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // futures-atlas-core ships TSX source; Next must transpile it.
  transpilePackages: ["futures-atlas-core"],

  // Baked once per deployment — the footer's "last updated" date.
  env: { NEXT_PUBLIC_BUILD_DATE: new Date().toISOString() },

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
        { source: "/village-oracle", destination: "/village-oracle/index.html" },
        { source: "/village-oracle/oracle", destination: "/village-oracle/oracle/index.html" },
        { source: "/village-oracle/research", destination: "/village-oracle/research/index.html" },
        { source: "/underground-intelligence", destination: "/underground-intelligence/index.html" },
        {
          source: "/underground-intelligence/:tab(story|dashboard|research)",
          destination: "/underground-intelligence/index.html",
        },
        // The Odds — canonical /theodds routes. The bundle physically lives at
        // /odds-of-surviving-ai/ (keeping its <base href> so assets resolve); the
        // per-player files give crawlers route-specific OG metadata.
        { source: "/theodds", destination: "/odds-of-surviving-ai/index.html" },
        { source: "/theodds/all", destination: "/odds-of-surviving-ai/index.html" },
        { source: "/theodds/dario-amodei", destination: "/odds-of-surviving-ai/p/dario-amodei.html" },
        { source: "/theodds/elon-musk", destination: "/odds-of-surviving-ai/p/elon-musk.html" },
        { source: "/theodds/max-tegmark", destination: "/odds-of-surviving-ai/p/max-tegmark.html" },
        { source: "/theodds/research", destination: "/odds-of-surviving-ai/research.html" },
        // Quantum Sandbox — single-page Vite static app (base path baked in)
        { source: "/quantum-sandbox", destination: "/quantum-sandbox/index.html" },
        // Generatives — Vite static app; the dashboard + a separate embed.html player
        { source: "/generatives", destination: "/generatives/index.html" },
        // Literal Frequency — Vite static app (Source Library word-frequency viz)
        { source: "/literal-frequency", destination: "/literal-frequency/index.html" },
        // Hyperscale — Vite static app (data-center management sim)
        { source: "/hyperscale", destination: "/hyperscale/index.html" },
        // Trajectories — Vite static app (generative filament sphere)
        { source: "/trajectories", destination: "/trajectories/index.html" },
        // Social Composer — Next static export (basePath baked in, trailingSlash)
        { source: "/social-composer", destination: "/social-composer/index.html" },
        { source: "/social-composer/about", destination: "/social-composer/about/index.html" },
        { source: "/social-composer/hollow-villages", destination: "/social-composer/hollow-villages/index.html" },
        // Swipe the Future — Next static export (basePath baked in, trailingSlash)
        { source: "/swipe-the-future", destination: "/swipe-the-future/index.html" },
        // Woodchipper Futures — Next static export (USAID cuts scenario engine)
        { source: "/woodchipper", destination: "/woodchipper/index.html" },
        // Quantum Dominance — Next static export (graphic-novel scenario explorer)
        { source: "/quantum-dominance", destination: "/quantum-dominance/index.html" },
        // Signal Reactor — Next static export (foresight briefing generator;
        // its generate API runs in THIS app at /api/signal-reactor/*)
        { source: "/signal-reactor", destination: "/signal-reactor/index.html" },
        // Quantum Spark — Next static export (inspirational insight generator;
        // its spark API runs in THIS app at /api/quantum-spark/*)
        { source: "/quantum-spark", destination: "/quantum-spark/index.html" },
      ],
    };
  },

  // The shared nav/footer/share bundle is referenced by a fixed path on every
  // page (host + sub-apps), so it must always revalidate — otherwise a browser
  // keeps a stale atlas-nav.js and misses updates (e.g. the global Share tool).
  async headers() {
    return [
      {
        source: "/atlas-nav.:ext(js|css)",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },

  // Generatives was formerly "Prism" at /prism — keep old links + embeds working.
  async redirects() {
    return [
      { source: "/prism", destination: "/generatives", permanent: true },
      // Gigawatt became THE Hyperscale (the older sim was retired from the site)
      { source: "/gigawatt", destination: "/hyperscale", permanent: true },
      { source: "/gigawatt/:path*", destination: "/hyperscale/:path*", permanent: true },
      { source: "/prism/:path*", destination: "/generatives/:path*", permanent: true },
      { source: "/visualize", destination: "/literal-frequency", permanent: true },
      { source: "/visualize/:path*", destination: "/literal-frequency/:path*", permanent: true },
      // The Odds moved to /theodds — keep the old entry URLs working. (Only the
      // two HTML entry points redirect; the bundle's own assets at
      // /odds-of-surviving-ai/* are served directly and must NOT be matched.)
      { source: "/odds-of-surviving-ai", destination: "/theodds", permanent: true },
      { source: "/odds-of-surviving-ai/research", destination: "/theodds/research", permanent: true },
      // The Hollow Villages was renamed Village Oracle — keep old links working.
      { source: "/hollow-villages", destination: "/village-oracle", permanent: true },
      { source: "/hollow-villages/:path*", destination: "/village-oracle/:path*", permanent: true },
    ];
  },
};

export default nextConfig;
