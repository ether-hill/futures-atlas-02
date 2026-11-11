import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { RESPONSE } from "@/data/doom-score/response";
import { ResponseScore } from "../_engine/ResponseScore";
import { DoomHeader } from "../_hub/DoomHeader";
import { buildTalk } from "../_hub/home-data";
import "../doom-score.css";

export const metadata: Metadata = {
  title: "Play the response. The Doom Score. Futures Atlas",
  description: "Ten years of talk about extinction from AI, played as clicks, against every law, rule and pledge that answered it, played as notes.",
  robots: { index: false },
};

export default function PlayResponsePage() {
  const rows = RESPONSE.map(({ id, date, jurisdiction, kind, status, title, namesCatastrophic }) => ({ id, date, jurisdiction, kind, status, title, namesCatastrophic }));
  return (
    <Container className="py-10">
      <DoomHeader
        compact
        title="Much talk, little action, played"
        lead="The talk about extinction from AI is the clicking: every post, paper, story and market, month by month. Every law, rule and pledge in answer is a note, in its continent's lane. The more binding it is, the higher it sits and the higher it sounds. Press play."
      />
      <ResponseScore rows={rows} talk={buildTalk()} />
    </Container>
  );
}
