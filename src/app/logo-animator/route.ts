import { LOGO_ANIMATOR_HTML } from "@/generated/logo-animator";

/**
 * The logo animator — an internal bench for the mark's motion.
 *
 * Not a page but a route handler, and deliberately so. The tool is one
 * self-contained document of canvas drawing with no React in it, and it has to
 * stay behind the editor gate: the middleware matcher skips any path with a
 * file extension, so anything served out of public/ would be open to the world.
 * An extension-less route is matched, and `/logo-animator` is in the internal
 * list in src/middleware.ts, so it signs in like /home-lab and /mocks.
 *
 * Edit tools/logo-animator/index.html, then `npm run gen:logo-animator`.
 */
export const dynamic = "force-static";

export function GET() {
  return new Response(LOGO_ANIMATOR_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  });
}
