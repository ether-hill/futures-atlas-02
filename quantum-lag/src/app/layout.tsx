import type { Metadata } from "next";
import localFont from "next/font/local";

import { Rise } from "@/components/Rise";

import "futures-atlas-core/tokens.css";
import "futures-atlas-core/kit.css";
import "./theme.css";
import "./globals.css";
import "./axis.css";
import "./chart.css";
import "./screens.css";
import "./visuals.css";

const archivo = localFont({
  src: [
    { path: "../../assets/fonts/archivo.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});

const bodoni = localFont({
  src: [
    { path: "../../assets/fonts/bodoni-moda-1.woff2", weight: "400 900", style: "normal" },
    { path: "../../assets/fonts/bodoni-moda-italic-0.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-bodoni",
  display: "swap",
});

const saira = localFont({
  src: [
    { path: "../../assets/fonts/saira-condensed-0.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/saira-condensed-1.woff2", weight: "500", style: "normal" },
    { path: "../../assets/fonts/saira-condensed-2.woff2", weight: "600", style: "normal" },
    { path: "../../assets/fonts/saira-condensed-3.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-saira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantum lag",
  description:
    "Place claims about quantum technology on a timeline, then find out where they actually sit. An instrument in the Futures Atlas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${archivo.variable} ${bodoni.variable} ${saira.variable}`}
    >
      <body>
        <div className="ql-field" aria-hidden="true" />
        <div className="ql-page">{children}</div>
        <Rise />
      </body>
    </html>
  );
}
