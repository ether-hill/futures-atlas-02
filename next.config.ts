import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // futures-atlas-core ships TSX source; Next must transpile it.
  transpilePackages: ["futures-atlas-core"],

  /*
   * Take webpack off its WebAssembly hasher.
   *
   * Builds were failing intermittently on Vercel with
   *   TypeError: Cannot read properties of undefined (reading 'length')
   *     at WasmHash._updateWithBuffer
   * — webpack's wasm xxhash64 receiving an empty buffer while hashing modules.
   * It is a flake, not a fault in this repo: the identical commit 90a6ec1
   * failed, failed again on redeploy, and passed on a third attempt, and every
   * failing commit builds cleanly here on the same Node (v24.15.0), including
   * with public/ fully populated by the sub-app builds.
   *
   * sha256 is Node's own crypto rather than the wasm module, so the failure
   * mode disappears. It costs a little build time and changes nothing about
   * the output beyond internal chunk hashes.
   */
  webpack: (config) => {
    config.output.hashFunction = "sha256";
    return config;
  },

  // Baked once per deployment. No longer the footer's "last updated" date —
  // that is generated into the footer markup itself by scripts/gen-footer.mjs,
  // so the host and every sub-app quote the same one. Kept because it is a
  // deploy stamp anything else can read.
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
        { source: "/theodds/stats", destination: "/odds-of-surviving-ai/stats.html" },
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
        // Actually Hard Questions — hand-authored static bundle (hash-routed single page)
        { source: "/actually-hard-questions", destination: "/actually-hard-questions/index.html" },
        // Social Composer — Next static export (basePath baked in, trailingSlash)
        { source: "/social-composer", destination: "/social-composer/index.html" },
        { source: "/social-composer/about", destination: "/social-composer/about/index.html" },
        { source: "/social-composer/village-oracle", destination: "/social-composer/village-oracle/index.html" },
        // Swipe the Future — Next static export (basePath baked in, trailingSlash)
        // The Counterfactual Index — one static bundle, three atlas entries.
        { source: "/manipulate-the-data", destination: "/manipulate-the-data/index.html" },
        {
          source: "/manipulate-the-data/quantum",
          destination: "/manipulate-the-data/quantum/index.html",
        },
        {
          source: "/manipulate-the-data/ai-gigawatts",
          destination: "/manipulate-the-data/ai-gigawatts/index.html",
        },

        { source: "/swipe-the-future", destination: "/swipe-the-future/index.html" },
        { source: "/swipe-the-future/stats", destination: "/swipe-the-future/stats/index.html" },
        // Swipe the Future v1 — the original game, frozen. Draft-gated.
        { source: "/swipe-v1", destination: "/swipe-v1/index.html" },
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
        // Magnifica — Vite bundle (one real encyclical, sixteen predicted answers)
        { source: "/magnifica", destination: "/magnifica/index.html" },
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
      // The shared footer, fetched by atlas-nav.js on every sub-app page. Same
      // rule and the same reason as the nav bundle above: it is referenced by a
      // fixed path from bundles that deploy on their own schedule, so a cached
      // copy means a sub-app keeps showing last week's footer — which is how
      // the site ends up looking like it has two of them again.
      {
        source: "/atlas-footer.html",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
    ];
  },

  // Generatives was formerly "Prism" at /prism — keep old links + embeds working.
  async redirects() {
    return [
      { source: "/prism", destination: "/generatives", permanent: true },
      // The Counterfactual Index became Manipulate the data, and its
      // single-figure story stopped being called /one. The old paths were only
      // ever shared as previews, so these are cheap insurance on a bookmark.
      {
        source: "/counterfactual/one",
        destination: "/manipulate-the-data/ai-gigawatts",
        permanent: true,
      },
      { source: "/counterfactual", destination: "/manipulate-the-data", permanent: true },
      {
        source: "/counterfactual/:path*",
        destination: "/manipulate-the-data/:path*",
        permanent: true,
      },
      // The blog and the feed were two views of the same posts; the feed won,
      // so the blog is gone and its posts live at /feed/<slug>. These two rules
      // are all that remains of it — old links are already out in the world.
      { source: "/blog", destination: "/feed", permanent: true },
      { source: "/blog/:slug", destination: "/feed/:slug", permanent: true },
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
      // the Village Oracle composer route was renamed to match the project
      { source: "/social-composer/hollow-villages", destination: "/social-composer/village-oracle", permanent: true },
    ];
  },
};

export default nextConfig;
