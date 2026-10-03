import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * PRODUCTION IS OPEN TO CRAWLERS. Everywhere else is not.
 *
 * The whole host used to be closed (`Disallow: /`) because the atlas was draft
 * work shared by link only. It has a domain and a public launch now, so the
 * production site invites crawlers and the preview and staging deployments
 * still refuse them: they serve the same routes from a different hostname, and
 * a staging copy in an index is a duplicate of the real site at best.
 *
 * Three switches say the same thing and have to move together, or a bot that
 * reads one and not another gets a contradiction: this file, the
 * `X-Robots-Tag` header in next.config.ts, and `robots` in app/layout.tsx.
 *
 * Nothing here needs to list draft projects, the feed or the working pages.
 * On production they are not hidden, they are ABSENT: `visibility: "draft"`
 * and the STAGING_ONLY list in middleware.ts mean those URLs 404. What is
 * listed below is what genuinely exists on production and should not be
 * indexed anyway.
 */
const IS_PRODUCTION = process.env.VERCEL_ENV === "production";

export default function robots(): MetadataRoute.Robots {
  if (!IS_PRODUCTION) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The sign-in form, the editor's own overview, and endpoints that answer
      // JSON. None of them is a page anyone should arrive at from a search.
      disallow: ["/admin", "/editor", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
