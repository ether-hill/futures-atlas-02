import type { Metadata } from "next";
import "../../mocks/stack-games/games.css";
import { Sheet } from "../../mocks/stack-games/Sheet";

/**
 * The Stack, as four games — the project page.
 *
 * The games themselves live in `src/app/mocks/stack-games/`, where they were
 * built and where `scripts/record-stack-game.mjs` still films them. This route
 * is the same contact sheet pointed at its own boards, so a reader of the
 * project never follows a link into the editors-only area. Nothing is
 * duplicated: one Sheet, one set of games, two places they are served from.
 *
 * Draft. `visibility: "draft"` in src/data/projects.ts is what gates this URL —
 * see the middleware — and it is mirrored in public/atlas-nav.js.
 */
export const metadata: Metadata = {
  title: "The stack, as four games. Futures Atlas",
  description:
    "Four brick games built out of one inventory: every tool this studio works with, read four different ways.",
};

export default function StackGamesPage() {
  return <Sheet base="/stack-games" />;
}
