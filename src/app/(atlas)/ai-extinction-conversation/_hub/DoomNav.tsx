import { DoomNavLinks } from "./DoomNavLinks";
import { linkable } from "./pushed";

const LINKS: { href: string; label: string }[] = [
  { href: "/ai-extinction-conversation", label: "Home" },
  { href: "/ai-extinction-conversation/play", label: "Play" },
  { href: "/ai-extinction-conversation/play-response", label: "Play the response" },
  { href: "/ai-extinction-conversation/chronicle", label: "Chronicle" },
  { href: "/ai-extinction-conversation/chronicle-grid", label: "Chronicle wall" },
  { href: "/ai-extinction-conversation/dashboard", label: "Dashboard" },
  { href: "/ai-extinction-conversation/response", label: "Response" },
  { href: "/ai-extinction-conversation/response-grid", label: "Response grid" },
  { href: "/ai-extinction-conversation/voices", label: "Voices" },
  { href: "/ai-extinction-conversation/memes", label: "Memes" },
  { href: "/ai-extinction-conversation/ledger", label: "Ledger" },
  { href: "/ai-extinction-conversation/feed", label: "Feed" },
  { href: "/ai-extinction-conversation/methodology", label: "Method" },
  { href: "/ai-extinction-conversation/about", label: "About" },
  { href: "/ai-extinction-conversation/hero-lab", label: "Hero trials" },
];

/** The hub's own row of pages, under the atlas bar: only the pages this build has. */
export function DoomNav() {
  return <DoomNavLinks home={linkable("/ai-extinction-conversation")} links={LINKS.filter((l) => l.href !== "/ai-extinction-conversation" && linkable(l.href))} />;
}
