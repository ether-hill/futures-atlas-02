import type { Metadata } from "next";
import "./globals.css";

// Type system matches the Atlas tool pages: system-ui sans + ui-monospace
// (set in globals.css). No web fonts.

const DESC = "Pick your line of work, swipe Believe or Doubt on six grounded claims about how AI and quantum reshape it, then see how far your gut sat from where the evidence actually lands. Every card cites a real source.";
const IMG = "https://futures-atlas-02.vercel.app/projects/swipe-the-future.jpg";

export const metadata: Metadata = {
  title: "Swipe the Future — Calibration",
  description: DESC,
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Swipe the Future — Calibration",
    description: DESC,
    images: [IMG, "https://futures-atlas-02.vercel.app/projects/swipe-the-future-2.jpg", "https://futures-atlas-02.vercel.app/projects/swipe-the-future-3.jpg"],
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
