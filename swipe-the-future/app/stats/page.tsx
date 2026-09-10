import type { Metadata } from "next";
import StatsView from "./StatsView";

const DESC = "Which futures the public over-believes, which have already arrived without anyone noticing, and which sectors people can read at all. Live results from Swipe the Future.";

export const metadata: Metadata = {
  title: "Swipe the Future · what everyone believes",
  description: DESC,
  // Overrides the layout's canonical, which names the deck rather than this page.
  alternates: { canonical: "https://futures-atlas.com/swipe-the-future/stats" },
  openGraph: {
    type: "website",
    siteName: "Futures Atlas",
    title: "Swipe the Future · what everyone believes",
    description: DESC,
    images: ["https://futures-atlas.com/projects/swipe-the-future.jpg"],
  },
};

export default function StatsPage() {
  return <StatsView />;
}
