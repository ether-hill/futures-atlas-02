import { BUMPERS_HTML } from "@/generated/bumpers";

/**
 * The bumper bench: the end card for the social posts, the mark moving over a
 * background and the address under it. A route handler and not a page for the
 * same reason as /logo-animator: it stays behind the editor gate, and on
 * production it is absent (both lists in src/middleware.ts).
 *
 * Edit tools/bumpers/, then `npm run gen:bumpers`.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(BUMPERS_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  });
}
