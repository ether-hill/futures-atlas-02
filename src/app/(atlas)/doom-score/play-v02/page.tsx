import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { DoomScore } from "../_engine/DoomScore";
import { DoomNav } from "../_hub/DoomNav";
import { AI_ROWS, buildMoments, buildPile } from "../_hub/home-data";
import "../doom-score.css";

const TITLE = "The AI extinction conversation";
const DESC = "How talk of AI ending humanity grew from a forum footnote to a flood, 2009 to now, played as sound. Every dot is someone's guess at the chance, played as a note.";
const OG = { url: "/og/doom-score-play.jpg", width: 1200, height: 630, alt: "The AI extinction conversation: a big title and Play button over a chart of what has been said about AI ending humanity since 2009, rising to the right." };

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
