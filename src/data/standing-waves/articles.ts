import type { Article } from "./types";
import { sameMathDifferentWorlds } from "./articles/same-math-different-worlds";
import { faradayWaves } from "./articles/faraday-waves";
import { theWalkingDroplet } from "./articles/the-walking-droplet";
import { whereTheAnalogyBreaks } from "./articles/where-the-analogy-breaks";
import { scarsAndBilliards } from "./articles/scars-and-billiards";
import { vibrationIsntMagic } from "./articles/vibration-isnt-magic";

/** Reading order. Each article is its own file in ./articles. */
export const ARTICLES: Article[] = [
  sameMathDifferentWorlds,
  faradayWaves,
  theWalkingDroplet,
  whereTheAnalogyBreaks,
  scarsAndBilliards,
  vibrationIsntMagic,
];
