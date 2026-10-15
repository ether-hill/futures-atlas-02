import { BUMPERS_GRID_HTML } from "@/generated/bumpers";

/** Every bumper background side by side. See ../route.ts. */
export const dynamic = "force-static";

export function GET() {
  return new Response(BUMPERS_GRID_HTML, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "x-robots-tag": "noindex, nofollow",
      "cache-control": "no-store",
    },
  });
}
