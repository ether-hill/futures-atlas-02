import type { Metadata } from "next";
import FeedMock from "./FeedMock";
import { OG_IMAGES } from "@/lib/og";

/**
 * /mocks/instagram — what the Atlas's Instagram feed could look like, starting
 * with Swipe the Future. Gated with the rest of /mocks and noindexed.
 */
export const metadata: Metadata = {
  title: "Instagram preview. Futures Atlas",
  robots: { index: false },
  openGraph: {
    title: OG_IMAGES["/mocks/instagram"].title,
    images: [OG_IMAGES["/mocks/instagram"].image],
  },
  twitter: { card: "summary_large_image", images: [OG_IMAGES["/mocks/instagram"].image] },
};

export default function InstagramMock() {
  return <FeedMock />;
}
