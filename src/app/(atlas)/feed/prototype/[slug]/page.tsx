import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PROTOTYPES, prototypeBySlug, type Panel } from "@/data/prototypes";
import { formatPostDate } from "@/data/posts";

/**
 * A prototype board.
 *
 * A moodboard rather than an article: panels of unequal size, each one a
 * decision already made, in no particular reading order. The state line sits
 * above everything — a concept board that reads like a shipped feature is a
 * lie with good typography, and the whole page is arranged so you meet "not
 * built" before you meet anything else.
 *
 * Only live prototypes are prerendered, so a draft never exists as HTML in the
 * build output — the same rule the draft posts and draft projects follow.
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
  return { title: `${p.title} — Futures Atlas`, description: p.dek };
}

/* ── panels ──────────────────────────────────────────────────────────────── */

function Spectrum({ panel }: { panel: Panel }) {
  const partials = panel.partials ?? [];
  return (
    <div className="mt-6">
      {/* Bars first, at a readable height, then the key underneath. The
          figure sets the height AND the opacity, so a quiet partial looks
          quiet — the mark carries the same information twice rather than
          carrying decoration once. */}
      <div aria-hidden className="flex h-[168px] items-end gap-2">
        {partials.map((partial, i) => (
          <span
            key={i}
            className="flex-1 rounded-[1px]"
            style={{
              height: `${Math.max(partial.value, 3)}%`,
              background: "var(--accent)",
              opacity: 0.3 + (partial.value / 100) * 0.7,
            }}
          />
        ))}
      </div>

      <dl className="mt-6 grid gap-x-8 gap-y-4 min-[720px]:grid-cols-2 min-[1100px]:grid-cols-3">
        {partials.map((partial, i) => (
          <div key={i} className="border-t border-ink/[0.14] pt-3">
            <dt className="font-mono text-[15px] font-bold tracking-tight text-accent-deep">
              {partial.figure}
            </dt>
            <dd className="mt-1.5 text-[13px] leading-[1.55] text-ink/70">{partial.character}</dd>
            <dd className="mt-2 font-mono text-[10px] uppercase leading-[1.5] tracking-[0.1em] text-ink/40">
              {partial.from}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Palette({ panel }: { panel: Panel }) {
  return (
    <ul className="mt-6 grid gap-4 min-[560px]:grid-cols-2">
      {(panel.swatches ?? []).map((s) => (
        <li key={s.name} className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 h-10 w-10 shrink-0 rounded-[2px] border border-ink/[0.14]"
            style={{ background: s.value }}
          />
          <span className="min-w-0">
            <span className="block font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
              {s.name}
            </span>
            <span className="mt-1 block text-[13px] leading-[1.55] text-ink/65">{s.note}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function PanelBlock({ panel }: { panel: Panel }) {
  return (
    <section
      className={`rounded-[4px] border border-ink/[0.14] bg-surface p-6 min-[680px]:p-8 ${
        panel.wide ? "min-[900px]:col-span-2" : ""
      }`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">
        {panel.label}
      </p>

      {panel.body && (
        <p
          className={`mt-4 max-w-[64ch] leading-[1.65] text-ink/80 ${
            panel.wide ? "text-[clamp(15px,1.35vw,18px)]" : "text-[15px]"
          }`}
        >
          {panel.body}
        </p>
      )}

      {panel.kind === "spectrum" && <Spectrum panel={panel} />}
      {panel.kind === "palette" && <Palette panel={panel} />}
      {panel.kind === "material" && panel.fragment && (
        <pre className="mt-6 overflow-x-auto border-l-2 border-accent/40 pl-4 font-mono text-[12.5px] leading-[1.8] text-ink/80">
          {panel.fragment}
        </pre>
      )}
    </section>
  );
}

/* ── the page ────────────────────────────────────────────────────────────── */

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

        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="border border-accent/50 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-accent-deep">
            Prototype
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/45">
            Posted {formatPostDate(p.posted)}
          </span>
        </div>

        <h1 className="mt-6 max-w-[16ch] text-[clamp(38px,7vw,92px)] font-medium leading-[0.98] tracking-[-0.035em] text-ink">
          {p.title}
        </h1>
        <p className="mt-6 max-w-[56ch] text-[clamp(16px,1.5vw,21px)] leading-[1.55] text-ink/75">
          {p.dek}
        </p>

        {/* The state line, before anything else on the board. */}
        <p className="mt-9 max-w-[64ch] border-l-2 border-accent/50 pl-5 font-mono text-[12px] uppercase leading-[1.8] tracking-[0.1em] text-ink/60">
          {p.state}
        </p>

        <p className="mt-7 max-w-[64ch] text-[14px] leading-[1.7] text-ink/65">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink/45">
            A piece of{" "}
          </span>
          {p.partOf}
        </p>

        {/* Lineage sits high and is unmissable: an homage that hides its source
            is a copy with better manners. */}
        {p.lineage && (
          <section className="mt-10 rounded-[4px] border border-ink/[0.14] bg-surface p-6 min-[680px]:p-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent-deep">
              After
            </p>
            <p className="mt-4 text-[17px] leading-[1.5] text-ink">
              <a
                href={p.lineage.url}
                target="_blank"
                rel="noopener"
                className="text-accent-deep underline underline-offset-4"
              >
                {p.lineage.name}
              </a>{" "}
              <span className="text-ink/55">by {p.lineage.by}</span>
            </p>
            <p className="mt-4 max-w-[68ch] text-[14.5px] leading-[1.7] text-ink/70">
              {p.lineage.different}
            </p>
          </section>
        )}

        <div className="mt-4 grid gap-4 min-[900px]:grid-cols-2">
          {p.panels.map((panel, i) => (
            <PanelBlock key={i} panel={panel} />
          ))}
        </div>
      </Container>
    </main>
  );
}
