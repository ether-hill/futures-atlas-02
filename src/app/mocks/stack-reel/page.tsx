import type { Metadata } from "next";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The stack, as an ambient loop. Marks and names, nothing else.
 *
 * Built to be RECORDED (`scripts/record-stack.mjs`), not screengrabbed: the
 * About page's stack grid is a table, and a screengrab of a table is a table.
 *
 * Two things a naive version gets wrong:
 *
 * The marks are INLINED rather than <img>-ed, because every logo in
 * public/logos is authored `fill="currentColor"` — as an image each renders
 * black, which on a black ground is nothing at all. Inlined, `color` reaches
 * them, so each carries its own brand colour instead of a wall of white.
 *
 * Nothing on screen is text except the brand names: no title, no section
 * labels, no footer. It is a texture; the caption carries the words.
 *
 * Trademarks remain with their owners; used nominatively, as an inventory of
 * what this studio builds with. Gated and noindexed with the rest of /mocks.
 */

export const metadata: Metadata = {
  title: "Stack reel. Futures Atlas",
  robots: { index: false },
};

/**
 * [slug, name, brand colour]. Brands whose own mark is black get bone: their
 * actual colour on this ground would be a hole rather than a logo.
 */
const BONE = "#f2ede2";
type Item = [string, string, string];

const ROWS: Item[][] = [
  [
    ["claude", "Claude", "#D97757"],
    ["openai", "ChatGPT", "#10A37F"],
    ["mistral", "Mistral", "#FA520F"],
    ["deepseek", "DeepSeek", "#4D6BFE"],
    ["qwen", "Qwen", "#615CED"],
    ["cohere", "Cohere", "#39A06B"],
  ],
  [
    ["midjourney", "Midjourney", BONE],
    ["flux", "Flux", "#48C9B0"],
    ["stability", "Stability", "#A855F7"],
    ["runway", "Runway", BONE],
    ["kling", "Kling", "#3FA9F5"],
  ],
  [
    ["huggingface", "Hugging Face", "#FFD21E"],
    ["meta", "Llama", "#0467DF"],
    ["ollama", "Ollama", BONE],
    ["deepmind", "DeepMind", "#4285F4"],
    ["anthropic", "Anthropic", "#D97757"],
  ],
  [
    ["sora", "Sora", "#10A37F"],
    ["veo", "Veo", "#4285F4"],
    ["seedance", "Seedance", "#325AB4"],
    ["nanobanana", "Nano Banana", "#8E75B2"],
  ],
  [
    ["nextjs", "Next.js", BONE],
    ["react", "React", "#61DAFB"],
    ["threejs", "Three.js", BONE],
    ["p5js", "p5.js", "#ED225D"],
    ["d3", "D3", "#F9A03C"],
    ["tailwindcss", "Tailwind", "#06B6D4"],
  ],
  [
    ["vercel", "Vercel", BONE],
    ["makemode", "MakeMode", "#FFC400"],
    ["microsoft", "Microsoft", "#00A4EF"],
    ["huggingface", "Transformers", "#FFD21E"],
    ["threejs", "WebGL", BONE],
  ],
];

/** Inline the mark so `currentColor` resolves to the tile's brand colour. */
function mark(slug: string): string {
  try {
    return readFileSync(join(process.cwd(), "public/logos", `${slug}.svg`), "utf8")
      .replace(/<\?xml[^>]*\?>/g, "")
      .replace(/<svg /, '<svg aria-hidden="true" ');
  } catch {
    return "";
  }
}

/** Periods, in seconds. No two share a factor, so the rows never fall in step. */
const DUR = [41, 53, 37, 61, 47, 43];

export default function StackReel() {
  return (
    <div className="sr">
      <style>{`
        html, body { background: #08090b; margin: 0; }
        .sr {
          position: fixed; inset: 0; overflow: hidden;
          background:
            radial-gradient(110% 60% at 50% 0%, rgba(59,147,213,.14) 0%, transparent 62%),
            radial-gradient(90% 55% at 15% 100%, rgba(59,147,213,.09) 0%, transparent 58%),
            #08090b;
          font-family: var(--font-archivo), system-ui, sans-serif;
          display: flex; flex-direction: column; justify-content: center; gap: 14px;
          /* Fades top and bottom as well as the sides, so the rows read as a
             slice of something larger rather than a list that starts and ends. */
          -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 10%, #000 90%, transparent 100%);
          mask-image: linear-gradient(180deg, transparent 0%, #000 10%, #000 90%, transparent 100%);
        }
        .sr-row {
          position: relative; overflow: hidden;
          -webkit-mask-image: linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%);
          mask-image: linear-gradient(90deg, transparent 0%, #000 20%, #000 80%, transparent 100%);
        }
        .sr-track { display: flex; gap: 14px; width: max-content; will-change: transform; }
        .sr-row:nth-child(odd)  .sr-track { animation: sr-l var(--dur) linear infinite; }
        .sr-row:nth-child(even) .sr-track { animation: sr-r var(--dur) linear infinite; }
        @keyframes sr-l { from { transform: translateX(0); }    to { transform: translateX(-50%); } }
        @keyframes sr-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }

        /* Square. The Atlas does not round its corners. */
        .sr-tile {
          flex: 0 0 auto; display: flex; align-items: center; gap: 14px;
          padding: 20px 24px; border: 1px solid rgba(242,237,226,.14);
          background: linear-gradient(150deg, rgba(242,237,226,.06), rgba(242,237,226,.018));
        }
        .sr-tile svg { width: 28px; height: 28px; display: block; flex: 0 0 auto; }
        .sr-name {
          font-size: 17px; font-weight: 500; letter-spacing: -.012em;
          white-space: nowrap; color: rgba(242,237,226,.92);
        }
      `}</style>

      {ROWS.map((row, i) => (
        <div className="sr-row" key={i}>
          <div
            className="sr-track"
            // Doubled below, so translating exactly -50% loops without a seam.
            style={{ ["--dur" as string]: `${DUR[i % DUR.length]}s` }}
          >
            {[...row, ...row].map(([slug, name, colour], k) => (
              <div className="sr-tile" key={`${slug}-${k}`}>
                <span
                  style={{ color: colour, display: "block" }}
                  dangerouslySetInnerHTML={{ __html: mark(slug) }}
                />
                <span className="sr-name">{name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
