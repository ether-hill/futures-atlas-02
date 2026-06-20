import type { Metadata } from "next";
import { Bodoni_Moda, Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { FaShell } from "./fa-shell";

// Futures Atlas type system: Archivo 800 display, Bodoni Moda serif voice,
// IBM Plex Mono data/labels/body.
const script = Bodoni_Moda({
  variable: "--ff-script",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});
const display = Archivo({
  variable: "--ff-display",
  subsets: ["latin"],
  weight: ["800"],
  style: ["normal"],
  display: "swap",
});
const plex = IBM_Plex_Mono({
  variable: "--ff-docket",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Social Composer",
  description: "A standalone social-post composer — post types, layouts, motion, and PNG / ZIP / GIF / video export.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${script.variable} ${display.variable} ${plex.variable} h-full antialiased`}>
      <body className="h-full flex flex-col overflow-hidden bg-bone text-ink font-docket">
        <FaShell />
        <div className="flex-1 min-h-0 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
