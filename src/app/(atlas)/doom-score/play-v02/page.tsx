import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SHARE_CARDS } from "@/data/share-cards";
import { DoomScore } from "../_engine/DoomScore";
import { DoomNav } from "../_hub/DoomNav";
import { AI_ROWS, buildMoments, buildPile } from "../_hub/home-data";
import "../doom-score.css";

// One entry for both this page's metadata and the card a link preview gets past the sign-in.
const CARD = SHARE_CARDS["/doom-score/play-v02"];
const TITLE = CARD.title;
const DESC = CARD.description;
const OG = { url: CARD.image, width: CARD.width, height: CARD.height, alt: CARD.alt };

export const metadata: Metadata = {
  title: `${TITLE}. The Doom Score. Futures Atlas`,
  description: DESC,
  openGraph: { type: "website", siteName: "Futures Atlas", title: TITLE, description: DESC, url: "/doom-score/play-v02", images: [OG] },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC, images: [OG.url] },
  robots: { index: false },
};

/** Trial: the score as a hero. Play opens it to the full screen. */
export default function PlayV02Page() {
  return (
    <div className="ds-hero-page">
      <Container className="ds-hero-nav">
        <DoomNav />
      </Container>
      <DoomScore
        hero={{
          title: "The AI extinction conversation",
          lead: "How talk of extinction from AI grew from a forum footnote to a flood, 2009 to now. Every square is one thing said; every dot is a number given, played as a note: the higher the chance, the higher the note.",
        }}
        mentions={AI_ROWS}
        pile={buildPile()}
        moments={buildMoments()}
      />
    </div>
  );
}
