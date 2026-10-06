import type { Metadata } from "next";
import "../../mocks/stack-games/games.css";
import "./_kit/v2.css";
import { loadMarks } from "../../mocks/stack-games/marks";
import { Intro } from "./_kit/Intro";

/**
 * The stack, as four games: the playable version. The self-playing reels it
 * grew out of still live in src/app/mocks/stack-games (the Instagram posts and
 * the recorder use them) and play here as each card's attract mode.
 *
 * The intro is four cabinets. Each one runs its game's reel as attract mode,
 * the way an arcade machine plays itself until someone puts a coin in, so the
 * rules are visible before a word is read.
 */
export const metadata: Metadata = {
  title: "The stack, as four games. Futures Atlas",
  description: "Four small games built out of one inventory: every tool this studio works with.",
  robots: { index: false },
};

export default function StackGamesV2() {
  return <Intro marks={loadMarks()} />;
}
