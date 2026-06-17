/**
 * /api/theme.css — the live override stylesheet, as CSS.
 *
 * Same overrides the root layout SSR-injects, but served as a standalone
 * stylesheet so non-Next zones (e.g. the static Underground Intelligence app)
 * can <link> it and share the atlas theme. Reuses buildOverrideCss so there is
 * a single source of truth; CORS-open so a zone on another origin can use it.
 */
import { buildOverrideCss } from "futures-atlas-core";
import { readOverrides } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const css = buildOverrideCss(await readOverrides());
  return new Response(css, {
    headers: {
      "content-type": "text/css; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    },
  });
}
