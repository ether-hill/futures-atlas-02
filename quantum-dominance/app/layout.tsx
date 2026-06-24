import type { Metadata } from "next";
import { Anton, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Deliberate graphic-novel identity (per the brief — NOT the Atlas base type system):
// Anton (impact slabs), Archivo (body), JetBrains Mono (HUD/labels).
const anton = Anton({ variable: "--font-anton", subsets: ["latin"], weight: ["400"], display: "swap" });
const archivo = Archivo({ variable: "--font-archivo", subsets: ["latin"], weight: ["400", "500", "600"], display: "swap" });
const jb = JetBrains_Mono({ variable: "--font-jbmono", subsets: ["latin"], weight: ["400", "500"], display: "swap" });

const DESC = "Speculative satire: one official 'quantum dominance' post, two lenses. Pick The Dystopia (it works for him) or The Backfire (the machine turns transparent the other way), and explore randomized futures — each anchored to something on the record.";
const IMG = "https://futures-atlas-02.vercel.app/projects/quantum-dominance.jpg";

export const metadata: Metadata = {
  title: "Quantum Dominance — Two Futures",
  description: DESC,
  openGraph: { type: "website", siteName: "Futures Atlas", title: "Quantum Dominance — Two Futures", description: DESC, images: [IMG] },
  twitter: { card: "summary_large_image", images: [IMG] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${anton.variable} ${archivo.variable} ${jb.variable}`}>
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
