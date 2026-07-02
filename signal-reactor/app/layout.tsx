import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Reactor · Foresight Briefings · Futures Atlas",
  description:
    "Enter your organization type, get a substance-first foresight briefing on quantum + advanced AI as a presentable slide deck. Deflate the hype, extrapolate the real signal.",
  openGraph: {
    siteName: "Futures Atlas",
    title: "Signal Reactor — Futures Atlas",
    description:
      "A substance-first foresight instrument: honest, AI-generated briefings on what quantum and advanced AI actually mean for your organization — built to structure a conversation, not to make the decision.",
    type: "website",
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
              '(function(){try{if(localStorage.getItem("fa-theme")!=="light")document.documentElement.classList.add("dark")}catch(e){}})();',
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
