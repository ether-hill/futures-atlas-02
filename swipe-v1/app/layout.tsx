import type { Metadata } from "next";
import "./globals.css";

// Type system matches the Atlas tool pages: system-ui sans + ui-monospace
// (set in globals.css). No web fonts.

const DESC = "The first version of Swipe the Future, kept as it was: pick your line of work and swipe Believe or Doubt on six sourced claims. The current game asks a different question, and lives at /swipe-the-future.";
const IMG = "https://futures-atlas-02.vercel.app/projects/swipe-v1.jpg";

export const metadata: Metadata = {
  title: "Swipe the Future v1 — Calibration",
  description: DESC,
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Swipe the Future v1 — Calibration",
    description: DESC,
    images: [IMG],
  },
  twitter: { card: "summary_large_image", images: [IMG] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{if(localStorage.getItem('fa-theme')!=='light')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
        <link rel="stylesheet" href="/atlas-nav.css" data-fa-nav-css />
        <script src="/atlas-nav.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
