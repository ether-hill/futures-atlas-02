import type { Metadata } from "next";
import localFont from "next/font/local";
import "futures-atlas-core/tokens.css";
import "./project-tokens.css";
import "./globals.css";

/* Shell type comes from the Futures Atlas kit. */
const archivo = localFont({
  src: [
    { path: "../assets/fonts/archivo.woff2", weight: "400 900", style: "normal" },
  ],
  variable: "--font-archivo",
  display: "swap",
});
const bodoni = localFont({
  src: [
    { path: "../assets/fonts/bodoni-moda-1.woff2", weight: "400 900", style: "normal" },
    { path: "../assets/fonts/bodoni-moda-italic-0.woff2", weight: "400 900", style: "italic" },
  ],
  variable: "--font-bodoni",
  display: "swap",
});
const saira = localFont({
  src: [
    { path: "../assets/fonts/saira-condensed-0.woff2", weight: "400", style: "normal" },
    { path: "../assets/fonts/saira-condensed-1.woff2", weight: "500", style: "normal" },
    { path: "../assets/fonts/saira-condensed-2.woff2", weight: "600", style: "normal" },
    { path: "../assets/fonts/saira-condensed-3.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-saira",
  display: "swap",
});

/* Chart type stays separate. The AI Index sets its charts in Circular Std, which
   is licensed; Figtree is the closest free stand-in, and swapping it for the
   shell face would break the one thing phase 1 was for. */
const figtree = localFont({
  src: [
    { path: "../assets/fonts/figtree.woff2", weight: "300 900", style: "normal" },
  ],
  variable: "--font-chart",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Counterfactual AI Index",
  description:
    "The 2026 Stanford AI Index charts, rebuilt from the official data, then redrawn under interventions that never happened.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${bodoni.variable} ${saira.variable} ${figtree.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
