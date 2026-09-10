import type { Metadata } from "next";
import localFont from "next/font/local";
// shared design system (defaults), must precede ./globals.css
import "futures-atlas-core/tokens.css";
import "futures-atlas-core/kit.css";
import "futures-atlas-core/nav.css";
import "./globals.css";
import { buildOverrideCss } from "futures-atlas-core";
import { readOverrides } from "@/lib/store";
import { siteOrigin } from "@/lib/site";

const archivo = localFont({
  src: [
    { path: "../../assets/fonts/archivo.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});
const bodoni = localFont({
  src: [
    { path: "../../assets/fonts/bodoni-moda-1.woff2", weight: "400 900", style: "normal" },
    { path: "../../assets/fonts/bodoni-moda-italic-0.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-bodoni",
  display: "swap",
});
const saira = localFont({
  src: [
    { path: "../../assets/fonts/saira-condensed-0.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/saira-condensed-1.woff2", weight: "500", style: "normal" },
    { path: "../../assets/fonts/saira-condensed-2.woff2", weight: "600", style: "normal" },
    { path: "../../assets/fonts/saira-condensed-3.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-saira",
  display: "swap",
});
const plexMono = localFont({
  src: [
    { path: "../../assets/fonts/ibm-plex-mono-0.woff2", weight: "300", style: "normal" },
    { path: "../../assets/fonts/ibm-plex-mono-1.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/ibm-plex-mono-2.woff2", weight: "500", style: "normal" },
    { path: "../../assets/fonts/ibm-plex-mono-3.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-plex-mono",
  display: "swap",
});

const SITE_DESC =
  "Speculative-design projects, open-source tools, apps and prototypes exploring compute: quantum systems, AI, and the power structures driving them.";

export const metadata: Metadata = {
  // Absolute URLs for Open Graph images and the like. The host lives in
  // lib/site.ts (production address, with the preview branch URL substituted on
  // a staging build), so switching to a bought domain is one edit there.
  metadataBase: new URL(siteOrigin()),
  // Self-canonical, on every page. Three hostnames serve this same site
  // (the production address, the older futures-atlas-02 one, and staging) and
  // /path/ redirects to /path, so without this a crawler that has opened the
  // site to indexing would find four addresses for each page and pick one.
  //
  // "./" is Next's relative form: it resolves against the CURRENT pathname, so
  // this one line gives every route its own canonical, dynamic routes included,
  // with no per-page list to keep in step. A route that needs a different
  // canonical overrides `alternates` in its own metadata.
  alternates: { canonical: "./" },
  /*
   * Production invites crawlers, everything else refuses them. Preview and
   * staging serve the same routes from another hostname and an indexed copy
   * of one is a duplicate of the real site. Mirrored by app/robots.ts and the
   * X-Robots-Tag header in next.config.ts; all three move together or a bot
   * that reads one and not another gets a contradiction.
   */
  robots:
    process.env.VERCEL_ENV === "production"
      ? { index: true, follow: true, googleBot: { index: true, follow: true } }
      : {
          index: false,
          follow: false,
          nocache: true,
          googleBot: { index: false, follow: false, noimageindex: true },
        },
  title: "Futures Atlas, a catalogue of possible worlds",
  description: SITE_DESC,
  // Default Open Graph so any page (and the Share → Social Composer transmutate)
  // has a go-to image + summary; individual pages/projects override these.
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Futures Atlas, a catalogue of possible worlds",
    description: SITE_DESC,
    images: ["/og/home.jpg"],
  },
  twitter: { card: "summary_large_image", images: ["/og/home.jpg"] },
};

/*
 * The one piece of structured data on the site: what this thing is called and
 * where it lives.
 *
 * Nothing here is a claim the site does not already make in plain markup — the
 * name and the description are the same two strings the <title> and the meta
 * description carry. Deliberately no logo, no sameAs, no founder, no address:
 * an Organization block is only worth having if every field in it is true, and
 * inventing the rest to fill the shape is how a knowledge panel ends up wrong.
 * Add those when there is a real logo file and real profile URLs to point at.
 */
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteOrigin()}/#website`,
      name: "Futures Atlas",
      url: `${siteOrigin()}/`,
      description: SITE_DESC,
      inLanguage: "en-GB",
      publisher: { "@id": `${siteOrigin()}/#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${siteOrigin()}/#organization`,
      name: "Futures Atlas",
      url: `${siteOrigin()}/`,
    },
  ],
};

// Render per-request so the SSR-injected token overrides always reflect the
// current store, live theming applies site-wide with no rebuild.
export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // read the shared token overrides and inject them before paint (no flash)
  const overrideCss = buildOverrideCss(await readOverrides());

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Adaptive "F" favicon, light/dark by browser colour scheme. The svg
            self-adapts via @media (Safari/Firefox); the dark media link covers
            browsers that switch on the <link> instead. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }}
        />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('fa-theme')!=='light'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* Which environment the nav is drawing for, set BEFORE the deferred
            nav script runs. It decides whether staging-only entries (the feed)
            are listed at all; atlas-nav.js treats an unset flag as production,
            so it can only ever under-link. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.FA_ENV=${JSON.stringify(process.env.VERCEL_ENV ?? "development")};`,
          }}
        />
        {/* The one global nav, shared with every project bundle. The stylesheet
            is linked blocking in the head (not left to atlas-nav.js's async
            self-inject) so the bar + mobile sheet are fully styled at first
            paint, otherwise the unstyled sheet/burger flash on every load.
            atlas-nav.js sees this data-fa-nav-css link and skips re-injecting. */}
        <link rel="stylesheet" href="/atlas-nav.css?v=22" data-fa-nav-css />
        <script src="/atlas-nav.js?v=22" defer />
        {overrideCss && <style id="fa-overrides" dangerouslySetInnerHTML={{ __html: overrideCss }} />}
        {/*
          Without a script, every <Reveal> block stays at the opacity: 0 that
          globals.css parks it at, waiting for an IntersectionObserver that will
          never run: the home page, About, Developers and the whole projects
          grid render as empty space. Reduced motion is already covered further
          up that file; this covers the other way it can fail.
        */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}.fa-page-in{animation:none!important}`}</style>
        </noscript>
      </head>
      <body
        className={`${archivo.variable} ${bodoni.variable} ${saira.variable} ${plexMono.variable} min-h-screen flex flex-col`}
        // atlas-nav.js's reserveBarHeight() runs before hydration and, when it
        // reads the body's padding as 0 because globals.css has not applied
        // yet, writes an inline padding-top. WebKit hits that window on
        // /contact and React reported the extra attribute as a hydration
        // mismatch on every iPhone. The value it writes is the same 54px the
        // stylesheet gives, so there is nothing to reconcile — same reason
        // <html> above carries this.
        suppressHydrationWarning
      >
        {/* Skip link, the first thing in the document, so a keyboard user can
            jump the shared nav bar (brand, four links, Share, theme toggle)
            instead of tabbing through it on every page. It is off-screen until
            focused, then slides in at the top left.

            atlas-nav.js mounts that bar with insertBefore(header,
            body.firstChild), which would put the whole bar ahead of this link in
            the tab order, so once the deferred nav script has run the script
            below moves the header back behind it. The bar is position: fixed, so
            where it sits in the body has no bearing on the page.

            Target: (atlas)/layout.tsx gives its <main> id="main-content", which
            covers every hub page. Root-level pages outside that group (the 404,
            /admin/*, /editor) carry their own <main> and no id, so the click
            handler below falls back to the first <main> on the page. */}
        <a
          id="fa-skip-link"
          href="#main-content"
          className="fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-[2px] border border-ink bg-panel px-4 py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-ink transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var a=document.getElementById('fa-skip-link');if(!a)return;a.addEventListener('click',function(e){if(document.getElementById('main-content'))return;var m=document.querySelector('main');if(!m)return;e.preventDefault();m.setAttribute('tabindex','-1');m.focus();});})();`,
          }}
        />
        {/* Renders nothing unless an editor is signed in. */}
        {children}
      </body>
    </html>
  );
}
