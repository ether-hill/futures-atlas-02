import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Reactor · Foresight Briefings · Futures Atlas",
  // 199 characters got truncated in every result. This says the same thing in
  // the length a search engine will actually print.
  description:
    "Enter your organisation type and get a substance-first foresight briefing on quantum and advanced AI, delivered as a presentable slide deck.",
  // Self-referential canonical, written out in full. The bundle is a static
  // export with basePath + trailingSlash, so a relative form would resolve to
  // /signal-reactor/ and disagree with the URL the host actually serves and the
  // sitemap actually names. Change the host in src/lib/site.ts first, then here
  // and in the other bundles.
  alternates: { canonical: "https://futures-atlas.com/signal-reactor" },
  openGraph: {
    siteName: "Futures Atlas",
    title: "Signal Reactor · Futures Atlas",
    description:
      "A substance-first foresight instrument: honest, AI-generated briefings on what quantum and advanced AI mean for your organisation. The decision stays with you.",
    type: "website",
    // The page had no share image at all, so every link to it unfurled as text.
    // This is the same screengrab the atlas's own card for the project uses
    // (public/projects/signal-reactor-2.jpg in the host app), so a share of the
    // page and the card that leads to it show the same thing.
    //
    // Absolute rather than root-relative: a scraper reads this markup away from
    // the page it came from and has no origin to resolve a path against. The
    // host is written out because this sub-app is a separate npm project and
    // cannot import the host's src/lib/site.ts — change it there first, then
    // here and in the other bundles.
    images: ["https://futures-atlas.com/projects/signal-reactor-2.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://futures-atlas.com/projects/signal-reactor-2.jpg"],
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
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap"
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
