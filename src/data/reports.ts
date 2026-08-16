/**
 * The Atlas's own reports, in one list.
 *
 * Deliberately NOT posts. Every entry in `posts.ts` is commentary on someone
 * else's work and always shows the canonical `url` — that contract is the
 * feed's whole promise, and squeezing our own reporting into it would make the
 * Atlas the source of a link it also wrote. So reports get their own list and
 * their own card.
 *
 * Ordered newest first, which is how the feed shows them.
 */

import { MOSAIC as HEGEMONY_TILES, PUBLISHED as HEGEMONY } from "./hegemony";
import { MOSAIC as KILLCHAIN_TILES, PUBLISHED as KILLCHAIN } from "./killchain";
import { MOSAIC as STARTUP_TILES, PUBLISHED as STARTUP_CITIES } from "./startup-cities";

export interface ReportEntry {
  slug: string;
  href: string;
  title: string;
  /**
   * What the report covers, stated plainly. Descriptive rather than
   * argumentative: the findings make the case, the card does not need to.
   */
  dek: string;
  published: string;
  /**
   * The report's own coverage stills, for the card's wall and its masthead.
   * Every report now harvests these — a report without a checked image set is
   * a report that has not finished its coverage section.
   */
  tiles: string[];
}

export const REPORTS: ReportEntry[] = [
  {
    slug: "startup-cities",
    href: "/feed/startup-cities",
    title: "Start-up Cities",
    dek: "Privately governed cities and network states: the projects under way, who funds them, the legal arrangements they depend on, and the arbitration claim Próspera has brought against Honduras.",
    published: STARTUP_CITIES,
    tiles: STARTUP_TILES,
  },
  {
    slug: "ai-kill-chain",
    href: "/feed/ai-kill-chain",
    title: "AI in the Military",
    dek: "Where machine learning sits in military targeting: the systems in use, what is documented about human review, the model developers supplying them, and the current state of international law.",
    published: KILLCHAIN,
    tiles: KILLCHAIN_TILES,
  },
  {
    slug: "ai-hegemony",
    href: "/feed/ai-hegemony",
    title: "AI Hegemony",
    dek: "How the geographic and linguistic composition of AI training data was produced, what filtering did to it, and what is documented about the effects.",
    published: HEGEMONY,
    tiles: HEGEMONY_TILES,
  },
];
