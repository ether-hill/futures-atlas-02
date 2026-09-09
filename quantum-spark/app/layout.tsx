import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantum Spark · Five Sparks for What's Next · Futures Atlas",
  description:
    "Type your industry, get five glimpses of how quantum and next-wave AI could change it. Speculative, not predictive.",
  openGraph: {
    siteName: "Futures Atlas",
    title: "Quantum Spark · Futures Atlas",
    description:
      "Type your industry, get five glimpses of how quantum and next-wave AI could change it. Speculative, not predictive.",
    type: "website",
    // The page had no share image at all, so every link to it unfurled as text.
    // This is the same screengrab the atlas's own card for the project uses
    // (public/projects/quantum-spark-2.jpg in the host app), so a share of the
    // page and the card that leads to it show the same thing.
    //
    // Absolute rather than root-relative: a scraper reads this markup away from
    // the page it came from and has no origin to resolve a path against. The
    // host is written out because this sub-app is a separate npm project and
    // cannot import the host's src/lib/site.ts — change it there first, then
    // here and in the other bundles.
    images: ["https://futures-atlas.vercel.app/projects/quantum-spark-2.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://futures-atlas.vercel.app/projects/quantum-spark-2.jpg"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap"
        />
        {/* match the Atlas theme convention so the injected nav renders dark */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              '(function(){var r=document.documentElement;try{if(localStorage.getItem("fa-theme")!=="light")r.classList.add("dark")}catch(e){}r.classList.add("fa-js")})();',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
