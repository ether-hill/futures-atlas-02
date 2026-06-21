import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
// shared design system (defaults) — must precede ./globals.css
import "futures-atlas-core/tokens.css";
import "futures-atlas-core/kit.css";
import "futures-atlas-core/nav.css";
import "./globals.css";
import { buildOverrideCss } from "futures-atlas-core";
import { readOverrides } from "@/lib/store";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Futures Atlas — a catalogue of possible worlds",
  description:
    "An atlas of speculative-design and futures projects: each one a grounded forecast of how things could be otherwise.",
};

// Render per-request so the SSR-injected token overrides always reflect the
// current store — live theming applies site-wide with no rebuild.
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
        {/* Adaptive "F" favicon — light/dark by browser colour scheme. The svg
            self-adapts via @media (Safari/Firefox); the dark media link covers
            browsers that switch on the <link> instead. */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('fa-theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();`,
          }}
        />
        {/* The one global nav, shared with every project bundle. The stylesheet
            is linked blocking in the head (not left to atlas-nav.js's async
            self-inject) so the bar + mobile sheet are fully styled at first
            paint — otherwise the unstyled sheet/burger flash on every load.
            atlas-nav.js sees this data-fa-nav-css link and skips re-injecting. */}
        <link rel="stylesheet" href="/atlas-nav.css" data-fa-nav-css />
        <script src="/atlas-nav.js" defer />
        {overrideCss && <style id="fa-overrides" dangerouslySetInnerHTML={{ __html: overrideCss }} />}
      </head>
      <body
        className={`${archivo.variable} ${bodoni.variable} ${saira.variable} ${plexMono.variable} min-h-screen flex flex-col`}
      >
        {children}
      </body>
    </html>
  );
}
