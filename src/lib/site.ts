/**
 * The Atlas's public address, written down once.
 *
 * Everything that has to be absolute resolves from here: the Open Graph and
 * Twitter images (via `metadataBase` in app/layout.tsx), the canonical link on
 * every page, and the sitemap. Buying a domain, or opening the site to search
 * engines on a different host, is therefore a single edit to this constant —
 * nothing else in the app names a hostname.
 *
 * It was previously hardcoded in app/layout.tsx as futures-atlas-02.vercel.app,
 * which stopped being the production host, so every absolute image URL on the
 * live site pointed somewhere the images no longer were.
 */
export const SITE_URL = "https://futures-atlas.vercel.app";

/**
 * The origin the current deployment should call itself.
 *
 * Production is the public address above. A PREVIEW build uses its own branch
 * URL instead, so a staging link unfurls with the images that exist on staging
 * rather than the ones on production, and a staging sitemap describes staging.
 * Local development has neither variable and falls through to production, which
 * only ever affects the absolute URLs printed into markup nobody crawls.
 */
export function siteOrigin(): string {
  return process.env.VERCEL_ENV === "preview" && process.env.VERCEL_BRANCH_URL
    ? `https://${process.env.VERCEL_BRANCH_URL}`
    : SITE_URL;
}
