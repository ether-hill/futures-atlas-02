import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { InstrumentFrame } from "@/components/feed/InstrumentFrame";
import { Theremin } from "@/components/prototype/Theremin";
import { formatPostDate } from "@/data/posts";
import { PROTOTYPES, prototypeBySlug } from "@/data/prototypes";

/**
 * A prototype page. Same furniture as a post page — back link, badge row,
 * extrabold title, serif standfirst, `bg-surface` ground — so it reads as part
 * of the feed rather than as a page from a different site.
 *
 * What sits between the standfirst and the atlas is the instrument itself,
 * framed live rather than rebuilt: a reimplementation would drift from the
 * original the first time either side changed, and this page would then be
 * quietly claiming to be something it was not.
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

        {p.story && (
          <div className="mt-[clamp(20px,2.6vw,32px)] max-w-[68ch] space-y-4 text-[15px] leading-[1.75] text-ink/75">
            {p.story.map((para) => (
              <p key={para.slice(0, 40)}>{para}</p>
            ))}
          </div>
        )}

        {/* ── the instrument ─────────────────────────────────────────────
            Either one of ours, rendered, or one framed from elsewhere and
            cropped — see InstrumentFrame for why that frame is pinned. */}
        {p.instrument === "theremin" && <Theremin />}
        {p.embed && (
          <div className="mt-[clamp(28px,4vw,52px)]">
            <InstrumentFrame
              src={p.embed.src}
              title={p.title}
              crop={p.embed.crop}
              height={p.embed.height}
            />
          </div>
        )}

        {/* ── the frequency atlas, where there is one ─────────────────── */}
        {p.atlas && (() => {
          const atlas = p.atlas;
          return (
          <section className="mt-[clamp(40px,6vw,80px)]">
            {/* The face is set inline because core ships an unlayered
                `h1..h6 { font-family: … }` that beats the font-mono utility. */}
            <h2
              className="text-[10.5px] uppercase tracking-[0.16em] text-graphite"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
            >
              {atlas.title}
            </h2>

            <p className="mt-4 max-w-[76ch] text-[13.5px] leading-[1.7] text-ink/65">
              {atlas.legend}
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
                  {atlas.tones.map((t, i) => (
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
              {atlas.mechanics}
            </p>
          </section>
          );
        })()}

        {/* ── more info ──────────────────────────────────────────────────── */}
        {p.more && (
          <section className="mt-[clamp(40px,6vw,80px)] border-t border-ink/[0.14] pt-[clamp(28px,4vw,48px)]">
            <h2
              className="text-[10.5px] uppercase tracking-[0.16em] text-graphite"
              style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}
            >
              More info
            </h2>

            <div className="mt-8 grid gap-x-10 gap-y-9 min-[900px]:grid-cols-2">
              {p.more.map((m) => (
                <div key={m.heading}>
                  <h3 className="text-[17px] font-medium leading-[1.3] tracking-[-0.015em] text-ink">
                    {m.heading}
                  </h3>
                  <p className="mt-3 max-w-[62ch] text-[14.5px] leading-[1.7] text-ink/70">
                    {m.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

      </Container>
    </article>
  );
}
