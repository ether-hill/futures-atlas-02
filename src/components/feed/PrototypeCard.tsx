import Link from "next/link";
import type { Prototype } from "@/data/prototypes";

/**
 * The feed's card for a prototype — one column.
 *
 * Carries the source's own eyebrow, title and description and nothing written
 * for the card. The only mark is the frequency atlas itself, drawn as the
 * tones it actually contains: one tick per tone, placed on a log scale across
 * the range it covers, because the set runs from 110 Hz to 963 Hz and a linear
 * axis would bunch four fifths of them into the left third.
 *
 * No picture: the source page has none either, and inventing one would be
 * decorating somebody else's work.
 */
export function PrototypeCard({ prototype: p }: { prototype: Prototype }) {
  const hz = p.atlas.tones.map((t) => t.hz);
  const lo = Math.log10(Math.min(...hz));
  const hi = Math.log10(Math.max(...hz));

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-ink/[0.14] bg-surface transition-colors hover:border-accent">
      <Link href={`/feed/prototype/${p.slug}`} className="flex h-full flex-col p-5 min-[680px]:p-6">
        <p className="font-mono text-[10px] uppercase leading-[1.5] tracking-[0.14em] text-accent-deep">
          {p.eyebrow}
        </p>

        {/* The atlas as a spectrum of ticks. Research-backed tones read
            stronger, which is the source's own rating and not our reading. */}
        <div aria-hidden className="relative mt-5 h-[86px] border-y border-ink/[0.12]">
          {p.atlas.tones.map((t, i) => (
            <span
              key={i}
              className="absolute top-0 h-full w-px"
              style={{
                left: `${((Math.log10(t.hz) - lo) / (hi - lo)) * 100}%`,
                background: "var(--accent)",
                opacity: t.ev === "R" ? 0.95 : t.ev === "T" ? 0.6 : 0.3,
              }}
            />
          ))}
        </div>
        <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-ink/35">
          {p.atlas.tones.length} tones · {Math.min(...hz)}–{Math.max(...hz)} Hz · log scale
        </p>

        <h3 className="mt-5 text-[19px] font-medium leading-[1.25] tracking-[-0.02em] text-ink group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4">
          {p.title}
        </h3>
        <p className="mt-2.5 text-[14px] leading-[1.6] text-ink/70">{p.description}</p>

        <p className="mt-auto pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink/45">
          {p.origin.by}
        </p>
      </Link>
    </article>
  );
}
