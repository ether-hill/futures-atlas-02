import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import "../../../mocks/stack-games/games.css";
import "../_kit/v2.css";
import { loadMarks } from "../../../mocks/stack-games/marks";
import { META, ORDER, type GameId } from "../_kit/meta";
import { StackGame } from "../_games/StackGame";
import { CascadeGame } from "../_games/CascadeGame";
import { BreakGame } from "../_games/BreakGame";
import { MergeGame } from "../_games/MergeGame";

export async function generateMetadata({ params }: { params: Promise<{ game: string }> }): Promise<Metadata> {
  const { game } = await params;
  const m = META[game as GameId];
  return { title: m ? `${m.title}. The stack, as four games` : "The stack, as four games", robots: { index: false } };
}

export default async function PlayPage({ params }: { params: Promise<{ game: string }> }) {
  const { game } = await params;
  // the reel-era slug for Stack, in case a link to it is out there
  if (game === "tetris") redirect("/stack-games/stack");
  if (!ORDER.includes(game as GameId)) notFound();
  const marks = loadMarks();
  return (
    <div className="g2">
      {game === "stack" && <StackGame marks={marks} />}
      {game === "cascade" && <CascadeGame marks={marks} />}
      {game === "break" && <BreakGame marks={marks} />}
      {game === "merge" && <MergeGame marks={marks} />}
    </div>
  );
}
