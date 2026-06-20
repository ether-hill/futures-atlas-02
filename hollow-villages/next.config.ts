import type { NextConfig } from "next";

// Multi-zone copy of The Hollow Villages, served under /hollow-villages so it can
// be reverse-proxied by futures-atlas-02. The original village-revitalisation-oracle
// deployment is untouched. basePath prefixes routes/links/next-image; assetPrefix
// prefixes the _next assets so the host app can route them.
const nextConfig: NextConfig = {
  basePath: "/hollow-villages",
  assetPrefix: "/hollow-villages",
  transpilePackages: ["futures-atlas-core"],
  // Served as a self-contained static export bundled inside futures-atlas-02 at
  // /hollow-villages (no longer reverse-proxied as a separate deployment).
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
