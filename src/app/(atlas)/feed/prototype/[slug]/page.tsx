import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PROTOTYPES, prototypeBySlug } from "@/data/prototypes";

/**
 * A prototype page — the source's own eyebrow, title, description, the actual
 * instrument, and its frequency atlas. Nothing else on the page.
 *
 * The instrument is FRAMED from the studio's own embed endpoint rather than
 * rebuilt. A reimplementation would drift from the original the first time
 * either side changed, and the page would then be quietly claiming to be
 * something it was not.
 *
 * The evidence column and both disclaimers are not optional furniture. The
 * ratings are the source's own and 29 of the 31 rows are N — numerology or
 * folklore. Rendering the claims without the column that rates them, or
 * without the line saying this is not a medical device, would turn a carefully
 * hedged table into an assertion.
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

/** R reads as the strong one because it is the only rating that is evidence. */
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
    <main className="pb-[clamp(60px,9vw,120px)]">
      <Container className="pt-[clamp(28px,5vw,56px)]">
        <Link
          href="/feed"
          className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink/55 underline-offset-4 hover:text-ink hover:underline"
        >
          ← The feed
        </Link>

        <p className="mt-9 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
          {p.eyebrow}
        </p>

        <h1 className="mt-5 text-[clamp(44px,9vw,116px)] font-medium leading-[0.96] tracking-[-0.04em] text-ink">
          {p.title}
        </h1>

        <p className="mt-6 max-w-[54ch] text-[clamp(17px,1.7vw,24px)] leading-[1.45] tracking-[-0.015em] text-ink/75">
          {p.description}
        </p>

        {/* Whose it is, and where it lives. */}
        <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
          {p.origin.by}
          {" · "}
          <a
            href={p.origin.url}
            target="_blank"
            rel="noopener"
            className="text-accent-deep underline-offset-4 hover:underline"
          >
            The original ↗
          </a>
        </p>

        {/* ── the instrument ─────────────────────────────────────────────── */}
        <div className="mt-12 overflow-hidden rounded-[12px] border border-ink/[0.14] bg-surface">
          <iframe
            src={p.embed.src}
            width={p.embed.width}
            height={p.embed.height}
            loading="lazy"
            title={`${p.title} — ${p.origin.by}`}
            className="block w-full"
            style={{ border: 0, height: p.embed.height }}
            allow="autoplay"
          />
        </div>

        {/* ── the frequency atlas ────────────────────────────────────────── */}
        <section className="mt-[clamp(40px,6vw,80px)]">
          {/* The heading is an h2 because it IS the section's heading, and the
              face is set inline because core ships an unlayered
              `h1..h6 { font-family: … }` that beats the font-mono utility —
              the same precedence trap that hid the band headings. */}
          <h2
            className="text-[11px] uppercase tracking-[0.18em] text-accent-deep"
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
    </main>
  );
}
