import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quantum Spark · Five Sparks for What's Next · Futures Atlas",
  description:
    "Type your industry — get five bold, grounded glimpses of how quantum computing and next-wave AI will transform it. Inspiration, not fabrication.",
  openGraph: {
    siteName: "Futures Atlas",
    title: "Quantum Spark — Futures Atlas",
    description:
      "An inspirational quantum/AI insight generator: five electric, grounded provocations for any business — the kind that make a room lean forward.",
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
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&display=swap"
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
