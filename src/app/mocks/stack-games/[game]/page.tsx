import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../games.css";
import { loadMarks } from "../marks";
import { Solo } from "../Solo";
import { Tetris } from "../Tetris";
import { Cascade } from "../Cascade";
import { Break } from "../Break";
import { Merge } from "../Merge";

/**
 * One game, full-bleed, nothing else on the page. Built to be RECORDED
 * (`node scripts/record-stack-game.mjs <game>`), which is why there is no
 * chrome, no title and no way back: everything on screen is the reel.
 */

export const metadata: Metadata = {
  title: "Stack games. Futures Atlas",
  robots: { index: false },
};

export default async function GamePage({
  params,
  searchParams,
}: {
  params: Promise<{ game: string }>;
  searchParams: Promise<{ bare?: string }>;
}) {
  const { game } = await params;
  // ?bare drops every word on the board — the version that goes out as a post.
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
