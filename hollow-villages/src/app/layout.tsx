import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, Saira_Condensed, IBM_Plex_Mono } from "next/font/google";
import "futures-atlas-core/tokens.css";
import "futures-atlas-core/nav.css";
import "./globals.css";

// Display / headings
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Letters / oracle quotes
const bodoni = Bodoni_Moda({
  variable: "--font-bodoni",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

// Year markers
const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// Labels, data, captions, body
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const HV_DESC =
  "A speculative-design oracle that forecasts how depopulating rural villages could be revived. Write a letter; it answers at every scale and shows you the place in 2050. Everything it reads is real.";
const HV_IMG = "https://futures-atlas-02.vercel.app/projects/hollow-villages.jpg";

export const metadata: Metadata = {
  title: "Village Oracle — a forecast instrument for emptying villages",
  description: HV_DESC,
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Village Oracle — Futures Atlas",
    description: HV_DESC,
    images: [HV_IMG],
  },
  twitter: { card: "summary_large_image", images: [HV_IMG] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Futures Atlas F favicon (same across the whole platform) */}
        <link rel="icon" href="/village-oracle/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/village-oracle/favicon-dark.svg" type="image/svg+xml" media="(prefers-color-scheme: dark)" />
        {/* Set the theme class before paint to avoid a flash. The Hollow
            Villages defaults to LIGHT: it seeds the shared atlas-nav key
            (`fa-theme`) to "light" on first visit, so the injected master nav
            (which otherwise defaults project pages to dark) agrees. A saved
            choice always wins, and the nav's toggle keeps working. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var k='fa-theme',s=localStorage.getItem(k);if(s!=='dark'&&s!=='light'){s='light';localStorage.setItem(k,s);}document.documentElement.classList.toggle('dark',s==='dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${archivo.variable} ${bodoni.variable} ${saira.variable} ${plexMono.variable} min-h-screen flex flex-col`}
      >
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
