import type { Metadata } from "next";
import { Archivo, Bodoni_Moda, Saira_Condensed } from "next/font/google";

import { Rise } from "@/components/Rise";

import "futures-atlas-core/tokens.css";
import "futures-atlas-core/kit.css";
import "./theme.css";
import "./globals.css";
import "./axis.css";
import "./chart.css";
import "./screens.css";
import "./visuals.css";

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "800", "900"],
  variable: "--font-archivo",
  display: "swap",
});

const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic", "normal"],
  variable: "--font-bodoni",
  display: "swap",
});

const saira = Saira_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-saira",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quantum lag",
  description:
    "Place claims about quantum technology on a timeline, then find out where they actually sit. An instrument from the Centre for Quantum & Society, TU Delft.",
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
