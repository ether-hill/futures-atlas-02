/** Everything the intro and the play screens say about each game, in one place. */

export type GameId = "stack" | "cascade" | "break" | "merge";

export const ORDER: GameId[] = ["stack", "cascade", "break", "merge"];

export const META: Record<
  GameId,
  {
    n: string;
    title: string;
    line: string;
    goal: string;
    how: string[];
    keys: [string, string][];
    touch: string;
    /** the self-playing reel shown on the intro card */
    reel: "tetris" | "cascade" | "break" | "merge";
  }
> = {
  stack: {
    n: "01",
    title: "Stack",
    line: "Bricks fall. Fill a row and it clears.",
    goal: "Fill rows to clear them. Don't let the stack reach the top.",
    how: [
      "A full row clears and the tools in it are named on the way out.",
      "A row of one family scores triple.",
      "Every ten rows the bricks fall faster.",
    ],
    keys: [
      ["← →", "Move"],
      ["↑ or X", "Turn"],
      ["↓", "Drop faster"],
      ["Space", "Drop now"],
      ["P", "Pause"],
    ],
    touch: "On a phone, use the buttons under the well. Tap the well to turn.",
    reel: "tetris",
  },
  cascade: {
    n: "02",
    title: "Cascade",
    line: "Swap neighbours. Three of a family pop.",
    goal: "Score as much as you can in 25 moves.",
    how: [
      "Swap two bricks next to each other to line up three or more of one family.",
      "They pop, everything above falls, and new tools drop in.",
      "Pops set off by falling bricks score more each time they chain.",
    ],
    keys: [
      ["Drag", "Swap with a neighbour"],
      ["Click, click", "Swap two neighbours"],
      ["P", "Pause"],
    ],
    touch: "Drag a brick towards the one you want to swap it with.",
    reel: "cascade",
  },
  break: {
    n: "03",
    title: "Break",
    line: "One ball. Take the wall apart.",
    goal: "Clear the wall without dropping the ball three times.",
    how: [
      "Where the ball hits the paddle decides where it goes.",
      "Knock out a whole family for a bonus.",
      "Clear the wall and a faster one is built.",
    ],
    keys: [
      ["Mouse or ← →", "Move the paddle"],
      ["Click or Space", "Launch"],
      ["P", "Pause"],
    ],
    touch: "Slide your finger anywhere to move the paddle. Tap to launch.",
    reel: "break",
  },
  merge: {
    n: "04",
    title: "Merge",
    line: "Slide the board. Same family fuses.",
    goal: "Fuse a family four deep to bank it. Keep the board from filling up.",
    how: [
      "Everything slides at once. Two bricks of the same family fuse, as long as together they hold four tools or fewer.",
      "A brick holding four tools of one family banks out for big points.",
      "A new tool arrives after every slide.",
    ],
    keys: [
      ["Arrows or WASD", "Slide"],
      ["P", "Pause"],
    ],
    touch: "Swipe anywhere on the board to slide.",
    reel: "merge",
  },
};
