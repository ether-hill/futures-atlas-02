import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { InstrumentFrame } from "@/components/feed/InstrumentFrame";
import { formatPostDate } from "@/data/posts";
import { PROTOTYPES, prototypeBySlug } from "@/data/prototypes";

/**
 * A prototype page. Same furniture as a post page — back link, badge row,
 * extrabold title, serif standfirst, `bg-surface` ground — so it reads as part
 * of the feed rather than as a page from a different site.
 *
 * What sits between the standfirst and the atlas is the instrument itself,
 * framed live from the studio's project page. It is NOT rebuilt: a
 * reimplementation would drift from the original the first time either side
 * changed, and this page would then be quietly claiming to be something it was
 * not. It is also not the compact embed — that endpoint only builds a 480px
 * player strip, which stretched across a column reads as an empty bar.
 *
 * The evidence column and both disclaimers travel with the table. The ratings
 * are the source's own and 29 of the 31 rows are N — numerology or folklore.
 * Rendering the claims without the column that rates them, or without the line
 * saying this is not a medical device, would turn a carefully hedged table
 * into an assertion.
 */

export function generateStaticParams() {
  return PROTOTYPES.filter((p) => p.visibility === "live").map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = prototypeBySlug(slug);
  if (!p) return {};
  return { title: `${p.title} — Futures Atlas`, description: p.description };
}

/** R reads strongest because it is the only rating that is evidence. */
const EV_STYLE: Record<string, string> = {
  R: "border-accent/60 text-accent-deep",
  T: "border-ink/30 text-ink/70",
  N: "border-ink/20 text-ink/45",
};

export default async function PrototypePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = prototypeBySlug(slug);
  if (!p) notFound();

  return (
    <article className="bg-surface py-[clamp(36px,6vw,88px)]">
      <Container>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-graphite transition-colors hover:text-ink"
        >
          <span aria-hidden>←</span> All posts
        </Link>

        <header className="mt-[clamp(24px,3.4vw,44px)] max-w-[74ch]">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="rounded-[2px] px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-[0.14em]"
              style={{
                border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
                color: "var(--accent-deep)",
              }}
            >
              Prototype
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-graphite">
              {p.eyebrow}
            </span>
            <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-faint">
              {formatPostDate(p.posted)}
            </span>
          </div>

          <h1 className="mt-[clamp(16px,2.2vw,28px)] max-w-[22ch] text-[clamp(30px,4.4vw,62px)] font-extrabold leading-[1.0] tracking-[-0.022em] text-ink text-balance">
            {p.title}
          </h1>

          <p
            className="mt-[clamp(14px,1.8vw,22px)] max-w-[56ch]"
            style={{
              fontFamily: "var(--font-serif, var(--font-mono))",
              fontSize: "clamp(17px, 1.7vw, 22px)",
              lineHeight: 1.45,
              color: "var(--text)",
            }}
          >
            {p.description}
          </p>
        </header>

        {/* ── the instrument, live ───────────────────────────────────────
            Cropped to the instrument itself — see InstrumentFrame for why the
            iframe is pinned to a fixed width rather than given the column's. */}
        <div className="mt-[clamp(28px,4vw,52px)]">
          <InstrumentFrame src={p.embed.src} title={`${p.title} — ${p.origin.by}`} />
        </div>
        <p className="mt-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-faint">
          The live instrument, served by {p.origin.by} ·{" "}
          <a
            href={p.origin.url}
            target="_blank"
            rel="noopener"
            className="text-graphite transition-colors hover:text-ink"
          >
            open it full size ↗
          </a>
        </p>

        {/* ── the frequency atlas ────────────────────────────────────────── */}
        <section className="mt-[clamp(40px,6vw,80px)]">
          {/* The face is set inline because core ships an unlayered
              `h1..h6 { font-family: … }` that beats the font-mono utility. */}
          <h2
            className="text-[10.5px] uppercase tracking-[0.16em] text-graphite"
            style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
          >
            {p.atlas.title}
          </h2>

          <p className="mt-4 max-w-[76ch] text-[13.5px] leading-[1.7] text-ink/65">
            {p.atlas.legend}
          </p>

          {/* Wide tables scroll in their own container — the page body must
              never scroll sideways. */}
          <div className="mt-7 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/25">
                  {["HZ", "Frequency", "Category", "Said to", "Ev"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="py-3 pr-6 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/50"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.atlas.tones.map((t, i) => (
                  <tr key={`${t.label}-${i}`} className="border-b border-ink/[0.1]">
                    <td className="py-3 pr-6 font-mono text-[13px] tabular-nums text-ink">{t.hz}</td>
                    <td className="py-3 pr-6 text-[13.5px] leading-[1.5] text-ink/80">
                      {/* the source strips the numeric prefix in this column */}
                      {t.label.replace(/^[0-9.]+ · /, "")}
                    </td>
                    <td className="py-3 pr-6 font-mono text-[11px] uppercase tracking-[0.1em] text-ink/45">
                      {t.cat}
                    </td>
                    <td className="py-3 pr-6 text-[13.5px] leading-[1.5] text-ink/70">{t.claim}</td>
                    <td className="py-3">
                      <span
                        className={`inline-block border px-1.5 py-0.5 font-mono text-[10px] font-bold ${EV_STYLE[t.ev]}`}
                      >
                        {t.ev}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-7 max-w-[76ch] text-[13.5px] leading-[1.7] text-ink/65">
            {p.atlas.mechanics}
          </p>
        </section>
      </Container>
    </article>
  );
}
