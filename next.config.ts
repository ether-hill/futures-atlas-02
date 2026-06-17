import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // futures-atlas-core ships TSX source; Next must transpile it.
  transpilePackages: ["futures-atlas-core"],

  // Multi-zone: serve the whole Hollow Villages project within this site at
  // /hollow-villages, reverse-proxied to its basePath'd zone deployment. The
  // original village-revitalisation-oracle deployment is untouched.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/hollow-villages",
          destination: "https://hollow-villages-zone.vercel.app/hollow-villages",
        },
        {
          source: "/hollow-villages/:path*",
          destination: "https://hollow-villages-zone.vercel.app/hollow-villages/:path*",
        },
        {
          source: "/underground-intelligence",
          destination: "https://underground-intelligence-zone.vercel.app/underground-intelligence",
        },
        {
          source: "/underground-intelligence/:path*",
          destination: "https://underground-intelligence-zone.vercel.app/underground-intelligence/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
