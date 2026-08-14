import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Footer } from "./footer";

// Futures Atlas type system: Archivo 800 display, Bodoni Moda serif voice,
// IBM Plex Mono data/labels/body.
const script = localFont({
  src: [
    { path: "../../assets/fonts/bodoni-moda-1.woff2", weight: "400 900", style: "normal" },
    { path: "../../assets/fonts/bodoni-moda-italic-0.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--ff-script",
  display: "swap",
});
const display = localFont({
  src: [
    { path: "../../assets/fonts/archivo.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--ff-display",
  display: "swap",
});
const plex = localFont({
  src: [
    { path: "../../assets/fonts/ibm-plex-mono-0.woff2", weight: "300", style: "normal" },
    { path: "../../assets/fonts/ibm-plex-mono-1.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/ibm-plex-mono-2.woff2", weight: "500", style: "normal" },
    { path: "../../assets/fonts/ibm-plex-mono-3.woff2", weight: "600", style: "normal" },
  ],
  variable: "--ff-docket",
  display: "swap",
});

const SC_DESC = "A standalone social-post composer — post types, layouts, motion, and PNG / ZIP / GIF / video export, with a URL transmutate importer.";
const SC_IMG = "https://futures-atlas-02.vercel.app/projects/social-composer.jpg";

export const metadata: Metadata = {
  title: "Social Composer",
  description: SC_DESC,
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Social Composer — Futures Atlas",
    description: SC_DESC,
    images: [SC_IMG],
  },
  twitter: { card: "summary_large_image", images: [SC_IMG] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-fa-no-footer
      className={`${script.variable} ${display.variable} ${plex.variable} h-full antialiased`}
    >
      <head>
        {/* default the global nav (and page) to dark, no flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(localStorage.getItem('fa-theme')!=='light')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
        {/* the one shared global nav (+ its styles) */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <link rel="stylesheet" href="/atlas-nav.css" data-fa-nav-css />
        <script src="/atlas-nav.js" defer />
      </head>
      <body className="min-h-full bg-bone text-ink font-docket">
        {children}
        <Footer />
      </body>
    </html>
  );
}
