/**
 * Open Graph cards for the pages that have one of their own. Each is a
 * 1200×630 screengrab of the page itself, in public/og/, so a shared link
 * previews as the thing it opens rather than as the site's default card.
 *
 * Gated pages use this twice: on the page, and on the sign-in form that an
 * anonymous visitor (or a link unfurler) is rewritten to. The form reads the
 * `next` path and serves that page's card, so a private link still previews
 * as the page it leads to.
 */
export const OG_IMAGES: Record<string, { image: string; title: string }> = {
  "/": { image: "/og/home.jpg", title: "Futures Atlas, a catalogue of possible worlds" },
  "/plan": { image: "/og/plan.jpg", title: "The plan. Futures Atlas" },
  "/mocks/instagram": { image: "/og/instagram-preview.jpg", title: "Instagram preview. Futures Atlas" },
};

/** The card for a path, or null if the page has none of its own. */
export function ogFor(pathname: string) {
  return OG_IMAGES[pathname.replace(/\/+$/, "") || "/"] ?? null;
}
