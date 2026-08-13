import type { NextConfig } from "next";

/*
  Quantum Lag ships as a self-contained static export inside the Futures Atlas,
  served under /quantum-lag.

  basePath and assetPrefix cover routes, links and the _next assets. They do not
  cover a raw `<img src>`, so the photographs go through lib/asset.ts, which
  reads NEXT_PUBLIC_BASE_PATH below. Standalone, that variable is unset and the
  helper is a no-op.
*/
const BASE_PATH = "/quantum-lag";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH,
  assetPrefix: BASE_PATH,
  env: { NEXT_PUBLIC_BASE_PATH: BASE_PATH },
  transpilePackages: ["futures-atlas-core"],
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
