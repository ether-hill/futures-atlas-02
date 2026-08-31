import type { Metadata } from "next";
import FeedMock from "./FeedMock";

/**
 * /mocks/instagram — what the Atlas's Instagram feed could look like, starting
 * with Swipe the Future. Gated with the rest of /mocks and noindexed.
 */
export const metadata: Metadata = {
  title: "Instagram preview. Futures Atlas",
  robots: { index: false },
};

export default function InstagramMock() {
  return <FeedMock />;
}
