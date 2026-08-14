import type { Metadata } from "next";
import localFont from "next/font/local";
// shared design system (defaults), must precede ./globals.css
import "futures-atlas-core/tokens.css";
import "futures-atlas-core/kit.css";
import "futures-atlas-core/nav.css";
import "./globals.css";
import { buildOverrideCss } from "futures-atlas-core";
import { readOverrides } from "@/lib/store";

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
  "An atlas of speculative-design and futures projects: each one a grounded forecast of how things could be otherwise.";

export const metadata: Metadata = {
  metadataBase: new URL("https://futures-atlas-02.vercel.app"),
  title: "Futures Atlas, a catalogue of possible worlds",
  description: SITE_DESC,
  // Default Open Graph so any page (and the Share → Social Composer transmutate)
  // has a go-to image + summary; individual pages/projects override these.
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Futures Atlas, a catalogue of possible worlds",
    description: SITE_DESC,
    images: ["/projects/og-default.jpg"],
  },
  twitter: { card: "summary_large_image", images: ["/projects/og-default.jpg"] },
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
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('fa-theme')!=='light'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* The one global nav, shared with every project bundle. The stylesheet
            is linked blocking in the head (not left to atlas-nav.js's async
            self-inject) so the bar + mobile sheet are fully styled at first
            paint, otherwise the unstyled sheet/burger flash on every load.
            atlas-nav.js sees this data-fa-nav-css link and skips re-injecting. */}
        <link rel="stylesheet" href="/atlas-nav.css?v=18" data-fa-nav-css />
        <script src="/atlas-nav.js?v=18" defer />
        {overrideCss && <style id="fa-overrides" dangerouslySetInnerHTML={{ __html: overrideCss }} />}
      </head>
      <body
        className={`${archivo.variable} ${bodoni.variable} ${saira.variable} ${plexMono.variable} min-h-screen flex flex-col`}
      >
        {/* Renders nothing unless an editor is signed in. */}
        {children}
      </body>
    </html>
  );
}
