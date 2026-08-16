import Link from "next/link";
import type { Prototype } from "@/data/prototypes";

/**
 * The feed's card for a prototype — one column, no picture.
 *
 * There is no picture because there is nothing to photograph: the thing does
 * not exist yet. A render or a stock image would make it look further along
 * than it is, which is the one failure mode this card type has to avoid.
 *
 * So the visual IS the data. Where the board carries a spectrum panel the card
 * draws it as a bar of partials — the same figures, at card scale — which
 * doubles as an honest thumbnail: it is made of the thing it is advertising.
 * Where there is no spectrum, the card is typographic and says so by omission.
 *
 * `state` is on the card, not just the page. Somebody scrolling the feed
 * should not have to click through to learn that nothing is built.
 */
export function PrototypeCard({ prototype: p }: { prototype: Prototype }) {
  const spectrum = p.panels.find((panel) => panel.kind === "spectrum")?.partials ?? [];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-ink/[0.14] bg-surface transition-colors hover:border-accent">
      <Link href={`/feed/prototype/${p.slug}`} className="flex h-full flex-col p-5 min-[680px]:p-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="border border-accent/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Prototype
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/40">
            Concept board
          </span>
        </div>

        {/* The thumbnail: the nine partials, at the size a card allows. Each
            bar's height is its own figure, so this is a picture of the data
            and not an illustration of it. */}
        {spectrum.length > 0 && (
          <div aria-hidden className="mt-5 flex h-[92px] items-end gap-[3px]">
            {spectrum.map((partial, i) => (
              <span
                key={i}
                className="flex-1 rounded-[1px]"
                style={{
                  height: `${Math.max(partial.value, 4)}%`,
                  background: "var(--accent)",
                  // The quieter partials read quieter. Opacity tracks the
                  // figure too, so nothing here is decoration.
                  opacity: 0.35 + (partial.value / 100) * 0.65,
                }}
              />
            ))}
          </div>
        )}

        <h3 className="mt-5 text-[19px] font-medium leading-[1.25] tracking-[-0.02em] text-ink group-hover:underline group-hover:decoration-accent group-hover:underline-offset-4">
          {p.title}
        </h3>
        <p className="mt-2.5 text-[14px] leading-[1.6] text-ink/70">{p.dek}</p>

        <p className="mt-4 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-ink/40">
          A piece of
          <span className="mt-1 block normal-case tracking-[0.04em] text-ink/55">{p.partOf}</span>
        </p>

        <p className="mt-auto pt-5 font-mono text-[10px] uppercase leading-[1.6] tracking-[0.12em] text-ink/45">
          <span className="text-accent-deep">Not built</span> — concept board only
        </p>
      </Link>
    </article>
  );
}
