import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, Figtree, Saira_Condensed } from "next/font/google";
import "futures-atlas-core/tokens.css";
import "./project-tokens.css";
import "./globals.css";

/* Shell type comes from the Futures Atlas kit. */
const archivo = Archivo({ subsets: ["latin"], weight: ["400", "500", "800", "900"], variable: "--font-archivo" });
const bodoni = Bodoni_Moda({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-bodoni" });
const saira = Saira_Condensed({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-saira" });

/* Chart type stays separate. The AI Index sets its charts in Circular Std, which
   is licensed; Figtree is the closest free stand-in, and swapping it for the
   shell face would break the one thing phase 1 was for. */
const figtree = Figtree({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-chart" });

export const metadata: Metadata = {
  title: "Counterfactual AI Index",
  description:
    "The 2026 Stanford AI Index charts, rebuilt from the official data — and redrawn under interventions that never happened.",
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
