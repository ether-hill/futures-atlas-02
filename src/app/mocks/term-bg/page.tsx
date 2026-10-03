import type { Metadata } from "next";
import TermBackgrounds from "./TermBackgrounds";

/**
 * /mocks/term-bg: three cover systems for the vocabulary posts, each drawn
 * for every word, plus Solastalgia as a full carousel. Gated and
 * noindexed with the rest of /mocks.
 */
export const metadata: Metadata = {
  title: "Vocabulary covers. Futures Atlas",
  robots: { index: false },
};

export default function Page() {
  return <TermBackgrounds />;
}
