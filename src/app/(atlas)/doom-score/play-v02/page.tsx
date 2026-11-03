import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { DoomScore } from "../_engine/DoomScore";
import { DoomNav } from "../_hub/DoomNav";
import { AI_ROWS, buildMoments, buildPile } from "../_hub/home-data";
import "../doom-score.css";

export const metadata: Metadata = {
  title: "Play, v02. The Doom Score. Futures Atlas",
  description: "Sixteen years of the conversation about extinction from AI, played: every grain one thing said, every dot a number given, the turning points flagged.",
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
