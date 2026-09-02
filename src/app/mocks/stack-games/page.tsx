import type { Metadata } from "next";
import "./games.css";
import { Sheet } from "./Sheet";

/**
 * The contact sheet: one game per screen, at full size, in a real iframe of the
 * page that gets recorded — so what is on this sheet is exactly what comes out
 * of `scripts/record-stack-game.mjs`.
 */

export const metadata: Metadata = {
  title: "Stack games. Futures Atlas",
  robots: { index: false },
};

export default function StackGames() {
  return <Sheet />;
}
