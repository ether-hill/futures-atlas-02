import Link from "next/link";
import { formatPostDate } from "@/data/posts";
import type { Prototype } from "@/data/prototypes";

/**
 * The feed's card for a prototype — built to the same shape as a post card:
 * picture on top, tag and date, then title, description and the link out.
 * Nothing about a prototype needs a different structure, and having one would
 * just make the grid look accidental.
 *
 * The picture is a still of the instrument itself. A prototype card that
 * showed an abstract mark instead would be advertising the idea; showing the
 * thing tells a reader what they are about to open.
 */
export function PrototypeCard({ prototype: p }: { prototype: Prototype }) {
  const href = `/feed/prototype/${p.slug}`;

  return (
    <article
      className="flex flex-col overflow-hidden rounded-[4px] transition-colors hover:border-accent"
      style={{ background: "var(--panel)", border: "var(--border-hairline) solid var(--hairline)" }}
    >
      <Link href={href} className="group block">
        <div className="relative aspect-video overflow-hidden border-b border-ink/[0.12]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.image}
            alt=""
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
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
