import type { MetadataRoute } from "next";
import { draftPaths } from "@/data/projects";

/** Everything is crawlable except the internal areas and the unpublished
 *  projects. (The middleware already turns crawlers away from those; this keeps
 *  their URLs out of the index in the first place.) */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Bare paths: robots.txt prefix-matches, so each covers its subtree too.
      disallow: ["/admin", "/editor", "/home-lab", "/mocks", ...draftPaths],
    },
  };
}
