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

import { PUBLISHED as HEGEMONY } from "./hegemony";
import { PUBLISHED as KILLCHAIN } from "./killchain";
import { PUBLISHED as STARTUP_CITIES } from "./startup-cities";

export interface ReportEntry {
  slug: string;
  href: string;
  title: string;
  /** The one sentence that says what the report found, not what it is about. */
  dek: string;
  published: string;
  /** The hegemony report builds a picture wall from the coverage it credits;
      the others are typographic, because they have no image set to credit. */
  wall: boolean;
}

export const REPORTS: ReportEntry[] = [
  {
    slug: "startup-cities",
    href: "/feed/startup-cities",
    title: "Sovereign by contract",
    dek: "A private city on a Honduran island is claiming $10.6 billion from the country that hosted it, for changing its mind. Charter cities, network states, and the arbitration bill that follows.",
    published: STARTUP_CITIES,
    wall: false,
  },
  {
    slug: "ai-kill-chain",
    href: "/feed/ai-kill-chain",
    title: "Twenty seconds",
    dek: "The machine learning is not in the missile. It is upstream, in the finding and fixing of targets — where there is no trigger to guard and no moment anybody would recognise as a decision to fire.",
    published: KILLCHAIN,
    wall: false,
  },
  {
    slug: "ai-hegemony",
    href: "/feed/ai-hegemony",
    title: "Whose common sense?",
    dek: "The open web is about 41% English. GPT-3's training mix was 92.6%. That gap isn't the web — it's filtering. How Western assumptions get into AI systems, and what is actually documented.",
    published: HEGEMONY,
    wall: true,
  },
];
