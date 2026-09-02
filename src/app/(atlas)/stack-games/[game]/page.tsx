import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../../mocks/stack-games/games.css";
import { loadMarks } from "../../../mocks/stack-games/marks";
import { Solo } from "../../../mocks/stack-games/Solo";
import { Tetris } from "../../../mocks/stack-games/Tetris";
import { Cascade } from "../../../mocks/stack-games/Cascade";
import { Break } from "../../../mocks/stack-games/Break";
import { Merge } from "../../../mocks/stack-games/Merge";

/**
 * One game, full bleed — the project's own copy of the board, so the sheet at
 * /stack-games links inside the project rather than into /mocks. Same
 * components, same `?bare` switch the recorder uses.
 */
export const metadata: Metadata = {
  title: "The stack, as four games. Futures Atlas",
  robots: { index: false },
};

export default async function ProjectGamePage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ bare?: string }>;
}) {
  const { game } = await params;
  const bare = "bare" in (await searchParams);
  const marks = loadMarks();

  const board =
    game === "tetris" ? <Tetris marks={marks} bare={bare} /> :
    game === "cascade" ? <Cascade marks={marks} /> :
    game === "break" ? <Break marks={marks} bare={bare} /> :
    game === "merge" ? <Merge marks={marks} /> :
    null;

  if (!board) notFound();
  return <Solo>{board}</Solo>;
}
