import { DoomNavLinks } from "./DoomNavLinks";
import { linkable } from "./pushed";

const LINKS: { href: string; label: string }[] = [
  { href: "/doom-score", label: "Home" },
  { href: "/doom-score/play", label: "Play" },
  { href: "/doom-score/play-response", label: "Play the response" },
  { href: "/doom-score/chronicle", label: "Chronicle" },
  { href: "/doom-score/chronicle-grid", label: "Chronicle wall" },
  { href: "/doom-score/dashboard", label: "Dashboard" },
  { href: "/doom-score/response", label: "Response" },
  { href: "/doom-score/response-grid", label: "Response grid" },
  { href: "/doom-score/voices", label: "Voices" },
  { href: "/doom-score/memes", label: "Memes" },
  { href: "/doom-score/ledger", label: "Ledger" },
  { href: "/doom-score/feed", label: "Feed" },
  { href: "/doom-score/methodology", label: "Method" },
  { href: "/doom-score/about", label: "About" },
  { href: "/doom-score/hero-lab", label: "Hero trials" },
];

/** The hub's own row of pages, under the atlas bar: only the pages this build has. */
export function DoomNav() {
  return <DoomNavLinks home={linkable("/doom-score")} links={LINKS.filter((l) => l.href !== "/doom-score" && linkable(l.href))} />;
}
