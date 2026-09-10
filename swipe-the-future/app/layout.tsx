import type { Metadata, Viewport } from "next";
import "./globals.css";

// Type system matches the Atlas tool pages: system-ui sans + ui-monospace
// (set in globals.css). No web fonts.

// 252 characters, of which a search result showed about 150. The examples that
// were cut off anyway now live on the page rather than in the description.
const DESC = "One question, forty sourced claims: has this already happened, or not yet? Find out which futures you buy too early, and which arrived without you noticing.";
const IMG = "https://futures-atlas.com/projects/swipe-the-future.jpg";

export const metadata: Metadata = {
  title: "Swipe the Future · Calibration",
  description: DESC,
  // Self-referential canonical, written out in full. The bundle is a static
  // export with basePath + trailingSlash, so a relative form would resolve to
  // /swipe-the-future/ and disagree with the URL the host serves and the
  // sitemap names. The stats page overrides this with its own.
  alternates: { canonical: "https://futures-atlas.com/swipe-the-future" },
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Swipe the Future · Calibration",
    description: DESC,
    images: [IMG, "https://futures-atlas.com/projects/swipe-the-future-2.jpg", "https://futures-atlas.com/projects/swipe-the-future-3.jpg"],
  },
  twitter: { card: "summary_large_image", images: [IMG] },
};

/*
 * One viewport tag, with the value this app actually wants.
 *
 * The head below used to write <meta name="viewport" … viewport-fit=cover>
 * by hand. Next then emitted its own default viewport meta AFTER it, and the
 * later tag wins, so the notch inset the app was asking for never applied and
 * the page shipped two conflicting viewport metas. Declaring it here replaces
 * Next's default rather than racing it.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('fa-theme')!=='light')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
        <link rel="stylesheet" href="/atlas-nav.css" data-fa-nav-css />
        <script src="/atlas-nav.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
