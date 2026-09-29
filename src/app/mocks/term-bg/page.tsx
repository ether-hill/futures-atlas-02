import type { Metadata } from "next";
import TermBackgrounds from "./TermBackgrounds";

/**
 * /mocks/term-bg: the vocabulary card over a dozen blurred, moving grounds,
 * side by side, to pick one to replace the drawn node field. Gated and
 * noindexed with the rest of /mocks.
 */
export const metadata: Metadata = {
  title: "Term backgrounds. Futures Atlas",
  robots: { index: false },
};

export default function Page() {
  return <TermBackgrounds />;
}
