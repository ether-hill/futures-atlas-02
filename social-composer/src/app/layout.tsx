import type { Metadata } from "next";
import { Bodoni_Moda, Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Footer } from "./footer";

// Futures Atlas type system: Archivo 800 display, Bodoni Moda serif voice,
// IBM Plex Mono data/labels/body.
const script = Bodoni_Moda({
  variable: "--ff-script",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
const display = Archivo({
  variable: "--ff-display",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  style: ["normal"],
  display: "swap",
});
const plex = IBM_Plex_Mono({
  variable: "--ff-docket",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Social Composer",
  description: "A standalone social-post composer — post types, layouts, motion, and PNG / ZIP / GIF / video export.",
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
