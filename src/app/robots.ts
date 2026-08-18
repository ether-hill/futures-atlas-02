import type { MetadataRoute } from "next";

/** Nothing here is meant to be found by searching. The atlas and every project
 *  bundled under it is draft work, shared by link only, so the whole host is
 *  closed to crawlers. (next.config.ts sends a matching X-Robots-Tag: noindex
 *  on every response, for the bots that read headers but not this file.)
 *
 *  When a project is ready to be public, open it up here path by path — do not
 *  reopen the site wholesale. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
