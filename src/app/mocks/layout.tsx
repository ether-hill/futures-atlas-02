import type { Metadata } from "next";

/**
 * /mocks — ports of the design_handoff_futures_atlas bundle, restyled onto
 * the CURRENT Futures Atlas system: Archivo (the site display face, loaded
 * by the root layout) + the site mono stack — no external fonts. The mock
 * ships its own chrome, so the injected atlas bar/share/footer are
 * suppressed, and the body's reserved nav padding (the "grey top bar") is
 * removed. Design exploration only: noindexed, unlinked from the site.
 */

export const metadata: Metadata = {
  title: "Browse mocks — Futures Atlas",
  robots: { index: false },
};

export default function MocksLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <style>{`
        .fa-shell,.fa-share,.fa-foot{display:none!important}
        body{padding-top:0!important}
      `}</style>
      {children}
    </div>
  );
}
