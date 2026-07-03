import type { NextConfig } from "next";
// Self-contained static export inside Futures Atlas at /signal-reactor.
// Generation happens in the HOST app's route at /api/signal-reactor/generate
// (same origin), so no API key or server code lives in this bundle.
const nextConfig: NextConfig = {
  output: "export",
  basePath: "/signal-reactor",
  assetPrefix: "/signal-reactor",
  images: { unoptimized: true },
  trailingSlash: true,
  eslint: { ignoreDuringBuilds: true },
  // pptxgenjs references node builtins (node:fs / node:https) on its Node
  // code paths; strip the scheme and void the modules for the browser bundle
  // (we only use the in-browser writeFile).
  webpack: (config, { webpack }) => {
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      https: false,
      http: false,
      os: false,
      path: false,
    };
    return config;
  },
};
export default nextConfig;
