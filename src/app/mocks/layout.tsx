import type { Metadata } from "next";

/**
 * /mocks — design experiments, restyled onto the current Futures Atlas system:
 * Archivo (the site display face, loaded by the root layout) plus the site mono
 * stack, no external fonts. Noindexed and unlinked from the site.
 *
 * The atlas bar and footer stay. They used to be suppressed for the whole
 * directory, which was right for the browse comps — they ship their own chrome
 * — and wrong for everything else here, so that suppression now lives in
 * BrowseMock, next to the chrome it is making room for.
 */

export const metadata: Metadata = {
  title: "Mocks. Futures Atlas",
  robots: { index: false },
};

export default function MocksLayout({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
