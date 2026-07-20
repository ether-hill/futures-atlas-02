import type { MetadataRoute } from "next";

/** Everything is crawlable except the internal area. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
  };
}
