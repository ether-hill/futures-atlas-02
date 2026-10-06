import type { Metadata } from "next";
import "../../mocks/stack-games/games.css";
import "./_kit/v2.css";
import { loadMarks } from "../../mocks/stack-games/marks";
import { Intro } from "./_kit/Intro";

/**
 * The stack, as four games: v02, the playable one. LOCAL ONLY for now (a
 * branch, not on staging): /stack-games is still the reel sheet.
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
