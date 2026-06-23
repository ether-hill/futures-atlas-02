import type { Metadata } from "next";
import { Instrument_Serif, Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({ variable: "--ff-serif", subsets: ["latin"], weight: ["400"], style: ["normal", "italic"], display: "swap" });
const sans = Space_Grotesk({ variable: "--ff-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const mono = Space_Mono({ variable: "--ff-mono", subsets: ["latin"], weight: ["400", "700"], display: "swap" });

const DESC = "An interactive futures engine on the 2025 USAID cuts: pull the levers from the January-2025 chair — abolish, freeze, audit or reform — and watch a fact-checked, source-cited constellation of outcomes branch out. Every figure links to its study; modeled projections are labelled as such.";
const IMG = "https://futures-atlas-02.vercel.app/projects/woodchipper.jpg";

export const metadata: Metadata = {
  title: "Woodchipper Futures — running the USAID cuts",
  description: DESC,
  openGraph: {
    type: "website", siteName: "Futures Atlas",
    title: "Woodchipper Futures",
    description: DESC,
    images: [IMG, "https://futures-atlas-02.vercel.app/projects/woodchipper-2.jpg", "https://futures-atlas-02.vercel.app/projects/woodchipper-3.jpg"],
  },
  twitter: { card: "summary_large_image", images: [IMG] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
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
