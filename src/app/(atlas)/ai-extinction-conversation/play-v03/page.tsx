import type { Metadata } from "next";
import { SHARE_CARDS } from "@/data/share-cards";
import { DoomScore } from "../_engine/DoomScore";
import { AI_ROWS, buildMoments, buildPile } from "../_hub/home-data";
import "../doom-score.css";

// One entry for both this page's metadata and the card a link preview gets past the sign-in.
const CARD = SHARE_CARDS["/ai-extinction-conversation/play-v03"];
const TITLE = CARD.title;
const DESC = CARD.description;
const OG = { url: CARD.image, width: CARD.width, height: CARD.height, alt: CARD.alt };

export const metadata: Metadata = {
  title: `${TITLE}. Futures Atlas`,
  description: DESC,
  openGraph: { type: "website", siteName: "Futures Atlas", title: TITLE, description: DESC, url: "/ai-extinction-conversation/play-v03", images: [OG] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [OG.url] },
  robots: { index: false },
};

/** Trial v03: play-v02 with the data brought up to date (scrapers rerun and new timeline entries, 19 November 2026). */
export default function PlayV03Page() {
  return (
    <div className="ds-hero-page">
      <DoomScore
        hero={{
          title: "The AI extinction conversation",
          lead: "How talk of extinction from AI grew from a forum footnote to a flood, from 2009 to 19 November 2026. Every square is one thing said; every dot is a number given, played as a note: the higher the chance, the higher the note.",
        }}
        mentions={AI_ROWS}
        pile={buildPile()}
        moments={buildMoments()}
      />
    </div>
  );
}
