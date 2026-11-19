import type { Metadata } from "next";
import { SHARE_CARDS } from "@/data/share-cards";
import { DoomScore } from "./_engine/DoomScore";
import { AI_ROWS, buildMoments, buildPile } from "./_hub/home-data";
import "./doom-score.css";

// One entry for both this page's metadata and the card a link preview gets.
const CARD = SHARE_CARDS["/doom-score"];
const TITLE = CARD.title;
const DESC = CARD.description;
const OG = { url: CARD.image, width: CARD.width, height: CARD.height, alt: CARD.alt };

export const metadata: Metadata = {
  title: `${TITLE}. The Doom Score. Futures Atlas`,
  description: DESC,
  alternates: { canonical: "/doom-score" },
  openGraph: { type: "website", siteName: "Futures Atlas", title: TITLE, description: DESC, url: "/doom-score", images: [OG] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [OG.url] },
};

/** The project's home: the score as a hero. Play opens it to the full screen; Read opens the chronicle. */
export default function DoomScoreHome() {
  return (
    <div className="ds-hero-page">
      <DoomScore
        hero={{
          title: "The AI extinction conversation",
          lead: "How talk of extinction from AI grew from a forum footnote to a flood, from 2009 to 19 November 2026. Every square is one thing said; every dot is a number given, played as a note: the higher the chance, the higher the note.",
          read: { href: "/doom-score/chronicle", label: "Read" },
        }}
        mentions={AI_ROWS}
        pile={buildPile()}
        moments={buildMoments()}
      />
    </div>
  );
}
