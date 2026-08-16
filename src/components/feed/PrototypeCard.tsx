import Link from "next/link";
import { formatPostDate } from "@/data/posts";
import type { Prototype } from "@/data/prototypes";

/**
 * The feed's card for a prototype — built to the same shape as a post card:
 * picture on top, tag and date, then title, description and the link out.
 * Nothing about a prototype needs a different structure, and having one would
 * just make the grid look accidental.
 *
 * The picture slot follows the house pattern for a card with no image — the
 * hatch plate the feed already uses when a publisher ships no og:image — with
 * the frequency atlas drawn over it: one tick per tone on a log axis, because
 * the set runs 110–963 Hz and a linear axis buries four fifths of it in the
 * left third. Tick strength is the source's own evidence rating, not our
 * reading of it.
 */
export function PrototypeCard({ prototype: p }: { prototype: Prototype }) {
  const hz = p.atlas.tones.map((t) => t.hz);
  const lo = Math.log10(Math.min(...hz));
  const hi = Math.log10(Math.max(...hz));
  const href = `/feed/prototype/${p.slug}`;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[4px] transition-colors hover:border-accent"
      style={{ background: "var(--panel)", border: "var(--border-hairline) solid var(--hairline)" }}
    >
      <Link
        href={href}
        className="group relative block aspect-video overflow-hidden border-b border-ink/[0.12]"
      >
        <span className="fa-hatch absolute inset-0" aria-hidden />
        <span aria-hidden className="absolute inset-x-0 top-1/2 h-[46%] -translate-y-1/2">
          {p.atlas.tones.map((t, i) => (
            <span
              key={i}
              className="absolute top-0 h-full w-px"
              style={{
                left: `${((Math.log10(t.hz) - lo) / (hi - lo)) * 100}%`,
                background: "var(--accent)",
                opacity: t.ev === "R" ? 0.95 : t.ev === "T" ? 0.6 : 0.32,
              }}
            />
          ))}
        </span>
        <span className="absolute inset-0 flex items-end p-4">
          <span className="font-mono text-[clamp(13px,1.5vw,19px)] uppercase leading-[1.15] tracking-[0.06em] text-ink/75 transition-colors group-hover:text-accent">
            {p.origin.by}
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span
            className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
            style={{
              border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
              color: "var(--accent-deep)",
            }}
          >
            Prototype
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
            {formatPostDate(p.posted)}
          </span>
        </div>

        <Link href={href} className="group mt-2.5 block">
          <h2 className="text-[16.5px] font-extrabold leading-[1.25] tracking-[-0.018em] text-ink transition-colors group-hover:text-accent text-balance">
            {p.title}
          </h2>
          {/* Clamped, not shortened: the description is the source's own and
              stays whole in the data — the card just stops showing it after
              four lines so the grid keeps an even rhythm. */}
          <p
            className="mt-2 line-clamp-4"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "var(--text-body-size)",
              lineHeight: "var(--lh-body)",
              color: "var(--text-body)",
            }}
          >
            {p.description}
          </p>
        </Link>

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-4">
          <Link
            href={href}
            className="font-mono text-[10.5px] uppercase tracking-[0.13em] text-graphite transition-colors hover:text-ink"
          >
            Open the prototype →
          </Link>
        </div>
      </div>
    </article>
  );
}
