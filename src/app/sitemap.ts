import type { MetadataRoute } from "next";
import { liveProjects } from "@/data/projects";
import { siteOrigin } from "@/lib/site";

/**
 * The public map of the site: the hub pages, plus every project the public can
 * actually open.
 *
 * It is deliberately harmless while robots.ts still says Disallow: /. Nothing
 * crawls it today; the point is that the day indexing is opened, the map is
 * already there and already right, rather than being written in a hurry against
 * a list of URLs someone remembers.
 *
 * The project half is DERIVED from data/projects.ts — `liveProjects` is the
 * same list the /projects grid and the homepage strip are built from — so a
 * project cannot appear here unless it is `visibility: "live"`. Drafts are not
 * merely hidden on production: src/middleware.ts rewrites them to
 * /_internal-not-here, so listing one would be advertising a 404 and, worse,
 * the name of unpublished work.
 */

/**
 * Pages that belong to whoever is building the Atlas rather than to anyone
 * reading it. This mirrors STAGING_ONLY in src/middleware.ts, which answers to
 * these paths on production as though they were never built.
 *
 * The two lists below never produce one of these, so this is a guard rather
 * than a filter that currently removes anything: it is here so that adding a
 * hub page, or making one of these into a live project, cannot quietly put a
 * path into the sitemap that production refuses to serve.
 */
const STAGING_ONLY = [
  "/home-lab",
  "/plan",
  "/mocks",
  "/api/mocks",
  "/feed",
  "/api/feed",
  "/logo-animator",
  "/design-system",
  "/style-guide",
];

/**
 * The pages that are not projects: the way in, the shelf, who we are, how to
 * reach us, and how to use the work. Everything else under (atlas) is either a
 * project page (covered below) or staging-only.
 */
const HUB_PATHS = ["/", "/about", "/projects", "/contact", "/developers"];

/** True if `path` is one of the working pages production does not serve. */
function isStagingOnly(path: string): boolean {
  return STAGING_ONLY.some((base) => path === base || path.startsWith(`${base}/`));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteOrigin();

  // Bare paths, no trailing slash: /path/ 308s to /path, which is also what the
  // canonical link on the page says, so the sitemap names the destination.
  const url = (path: string) => (path === "/" ? origin : `${origin}${path}`);

  // Live projects served from inside this site. A project with no `path` is
  // either forthcoming or lives somewhere else entirely, and has no URL here.
  // `date` is the project's own publish date, so lastModified is real rather
  // than a number invented at build time; the hub pages have no such date and
  // are therefore listed without one.
  const projects = liveProjects
    .filter((p) => p.path && !isStagingOnly(p.path))
    .map((p) => ({ url: url(p.path!), lastModified: p.date }));

  return [
    ...HUB_PATHS.filter((p) => !isStagingOnly(p)).map((path) => ({ url: url(path) })),
    ...projects,
  ];
}
