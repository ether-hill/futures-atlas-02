import type { Metadata } from "next";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";

/**
 * /mocks — high-fidelity ports of the design_handoff_futures_atlas bundle
 * (Claude-app × Netflix browse UI, three themes). The mock ships its own
 * chrome (sidebar + footer), so this layout deliberately skips the atlas
 * nav/footer. Design exploration only: noindexed, unlinked from the site.
 */

const grotesk = Space_Grotesk({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-grotesk" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plexmono" });

export const metadata: Metadata = {
  title: "Browse mocks — Futures Atlas",
  robots: { index: false },
};

export default function MocksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${grotesk.variable} ${plexMono.variable}`}>
      {/* the mock brings its own chrome — suppress the injected global bar,
          share pill and footer while a /mocks route is mounted */}
      <style>{`.fa-shell,.fa-share,.fa-foot{display:none!important}`}</style>
      {children}
    </div>
  );
}
