/**
 * The stack, as game pieces.
 *
 * Same inventory the About page lists and the marquee reel scrolls, re-cut for
 * the brick games: every tool carries its own brand colour (for the mark) and a
 * FAMILY colour (for the brick's top edge), because the games need something
 * that two bricks can share. Matching on the family is what lets a row of Sora,
 * Veo and Runway read as "these belong together" rather than as a coincidence.
 *
 * Brands whose own mark is black get bone — their real colour on this ground
 * would be a hole rather than a logo.
 *
 * Trademarks remain with their owners; used nominatively, as an inventory of
 * what this studio builds with.
 */

export const BONE = "#f2ede2";

export type Group = "language" | "media" | "open" | "web";

export const GROUPS: { id: Group; label: string; hex: string }[] = [
  { id: "language", label: "Language", hex: "#D97757" },
  { id: "media", label: "Image & video", hex: "#A855F7" },
  { id: "open", label: "Open models", hex: "#FFD21E" },
  { id: "web", label: "Web & code", hex: "#3B93D5" },
];

export const GROUP_HEX: Record<Group, string> = Object.fromEntries(
  GROUPS.map((g) => [g.id, g.hex]),
) as Record<Group, string>;

export type Item = { slug: string; name: string; hex: string; group: Group };

export const ITEMS: Item[] = [
  { slug: "claude", name: "Claude", hex: "#D97757", group: "language" },
  { slug: "openai", name: "ChatGPT", hex: "#10A37F", group: "language" },
  { slug: "mistral", name: "Mistral", hex: "#FA520F", group: "language" },
  { slug: "deepseek", name: "DeepSeek", hex: "#4D6BFE", group: "language" },
  { slug: "qwen", name: "Qwen", hex: "#615CED", group: "language" },
  { slug: "cohere", name: "Cohere", hex: "#39A06B", group: "language" },
  { slug: "anthropic", name: "Anthropic", hex: "#D97757", group: "language" },

  { slug: "midjourney", name: "Midjourney", hex: BONE, group: "media" },
  { slug: "flux", name: "Flux", hex: "#48C9B0", group: "media" },
  { slug: "stability", name: "Stability", hex: "#A855F7", group: "media" },
  { slug: "runway", name: "Runway", hex: BONE, group: "media" },
  { slug: "kling", name: "Kling", hex: "#3FA9F5", group: "media" },
  { slug: "sora", name: "Sora", hex: "#10A37F", group: "media" },
  { slug: "veo", name: "Veo", hex: "#4285F4", group: "media" },
  { slug: "seedance", name: "Seedance", hex: "#325AB4", group: "media" },
  { slug: "nanobanana", name: "Nano Banana", hex: "#8E75B2", group: "media" },

  { slug: "huggingface", name: "Hugging Face", hex: "#FFD21E", group: "open" },
  { slug: "meta", name: "Llama", hex: "#0467DF", group: "open" },
  { slug: "ollama", name: "Ollama", hex: BONE, group: "open" },
  { slug: "deepmind", name: "DeepMind", hex: "#4285F4", group: "open" },

  { slug: "nextjs", name: "Next.js", hex: BONE, group: "web" },
  { slug: "react", name: "React", hex: "#61DAFB", group: "web" },
  { slug: "threejs", name: "Three.js", hex: BONE, group: "web" },
  { slug: "p5js", name: "p5.js", hex: "#ED225D", group: "web" },
  { slug: "d3", name: "D3", hex: "#F9A03C", group: "web" },
  { slug: "tailwindcss", name: "Tailwind", hex: "#06B6D4", group: "web" },
  { slug: "vercel", name: "Vercel", hex: BONE, group: "web" },
  { slug: "makemode", name: "MakeMode", hex: "#FFC400", group: "web" },
  { slug: "microsoft", name: "Microsoft", hex: "#00A4EF", group: "web" },
];

export const BY_GROUP: Record<Group, Item[]> = {
  language: ITEMS.filter((i) => i.group === "language"),
  media: ITEMS.filter((i) => i.group === "media"),
  open: ITEMS.filter((i) => i.group === "open"),
  web: ITEMS.filter((i) => i.group === "web"),
};

export type Marks = Record<string, string>;

/** The four games, in the order the contact sheet shows them. */
export const GAMES: { id: string; title: string; blurb: string }[] = [
  { id: "tetris", title: "Stack", blurb: "Bricks fall, lock, and a full row cancels out. The tools that cleared are named on their way off the board." },
  { id: "cascade", title: "Cascade", blurb: "Match three of a family. They pop, the column collapses, new tools drop in from the top." },
  { id: "break", title: "Break", blurb: "One ball takes the whole wall apart, and what was behind it turns out to be the studio." },
  { id: "merge", title: "Merge", blurb: "Same-family bricks fuse on every slide until a whole family banks out at once." },
];
