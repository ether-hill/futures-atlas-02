import type { NextConfig } from "next";

// The Counterfactual Index ships as a self-contained STATIC export inside the
// Futures Atlas, served under /counterfactual — same convention as
// village-oracle and swipe-the-future. One bundle carries all three views:
//
//   /counterfactual          the AI board
//   /counterfactual/quantum  the quantum board
//   /counterfactual/one      one figure, told
//
// They are three atlas entries because they are three different arguments, but
// they share a data layer and a transform engine, so building them three times
// would only give three copies of the same code.
const nextConfig: NextConfig = {
  // turbopack.root: the atlas has its own lockfile one level up, and without
  // this the sub-app build picks that as its root.
  turbopack: { root: import.meta.dirname },
  output: "export",
  basePath: "/counterfactual",
  assetPrefix: "/counterfactual",
  transpilePackages: ["futures-atlas-core"],
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
