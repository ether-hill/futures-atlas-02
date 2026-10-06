import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { MediaCredit } from "@/components/standing-waves/MediaCredit";
import { LANE_LABEL, STATUS_LABEL, SW_BASE, SW_TITLE } from "@/data/standing-waves/meta";
import { PEOPLE } from "@/data/standing-waves/people";
import { SOURCES } from "@/data/standing-waves/sources";
import { EVENTS } from "@/data/standing-waves/timeline";
import { MEDIA } from "@/data/standing-waves/media";
import { commonsSrcSet } from "@/lib/standing-waves/commons";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return PEOPLE.map((p) => ({ slug: p.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const p = PEOPLE.find((x) => x.id === slug);
  return { title: p ? `${p.name}. ${SW_TITLE}. Futures Atlas` : SW_TITLE, description: p?.role, robots: { index: false } };
}

const label = "font-mono text-[11px] uppercase tracking-[0.14em] text-graphite";

export default async function PersonPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const p = PEOPLE.find((x) => x.id === slug);
  if (!p) notFound();
  const sources = p.sourceIds.map((id) => SOURCES.find((s) => s.id === id)!).filter(Boolean);
  const events = EVENTS.filter((e) => e.people.includes(p.id)).sort((a, b) => a.year - b.year);
  const portrait = p.portraitMediaId ? MEDIA.find((m) => m.id === p.portraitMediaId) : undefined;

  return (
    <article className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="mx-auto grid max-w-[1000px] gap-10 md:grid-cols-[1fr_240px]">
          <div className="min-w-0">
            <Link href={`${SW_BASE}/people`} className={`${label} hover:text-ink`}>← All people</Link>
            <p className={`${label} mt-6`}>{p.years}</p>
            <h1 className="mt-2 text-[clamp(28px,4vw,50px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink">{p.name}</h1>
            <p className="mt-3 text-[16px] leading-[1.6] text-ink">{p.role}</p>
            <p className="mt-6 text-[15.5px] leading-[1.8] text-ink-70">{p.summary}</p>

            <h2 className={`${label} mt-10`}>Contributions</h2>
            <ul className="mt-3 flex list-disc flex-col gap-2 pl-5 text-[14.5px] leading-[1.7] text-ink-70">
              {p.contributions.map((c) => <li key={c}>{c}</li>)}
            </ul>

            {p.contested && (
              <section aria-labelledby="sw-contested" className="sw-box mt-10 p-5">
                <h2 id="sw-contested" className="flex items-center gap-3">
                  <span className="sw-badge" data-status="contested">{STATUS_LABEL.contested}</span>
                </h2>
                <p className="mt-3 text-[14.5px] leading-[1.7] text-ink">{p.contested}</p>
              </section>
            )}

            {p.elsewhere && p.elsewhere.length > 0 && (
              <section aria-labelledby="sw-elsewhere" className="mt-10">
                <h2 id="sw-elsewhere" className={label}>Their images, where they are published</h2>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-ink-70">
                  We do not reproduce these: they are not ours to show. They are linked where their owners publish them.
                </p>
                <ul className="mt-3 flex flex-col gap-2">
                  {p.elsewhere.map((l) => (
                    <li key={l.url}>
                      <a href={l.url} rel="noopener" className="text-[14px] text-ink underline underline-offset-4 hover:text-accent">{l.label} ↗</a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {events.length > 0 && (
              <section aria-labelledby="sw-events" className="mt-10">
                <h2 id="sw-events" className={label}>On the timeline</h2>
                <ul className="mt-3 flex flex-col gap-2">
                  {events.map((e) => (
                    <li key={e.id} data-lane={e.lane} className="flex items-baseline gap-2">
                      <span className="sw-dot" aria-hidden="true" />
                      <Link href={`${SW_BASE}/timeline#${e.id}`} className="text-[14px] text-ink underline underline-offset-4 hover:text-accent">
                        {e.year} · {e.title}
                      </Link>
                      <span className="sr-only">({LANE_LABEL[e.lane]})</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section aria-labelledby="sw-psources" className="mt-10 border-t border-ink/15 pt-6">
              <h2 id="sw-psources" className={label}>Sources</h2>
              <ol className="mt-3 flex list-decimal flex-col gap-2 pl-5 text-[13.5px] leading-[1.65] text-ink-70">
                {sources.map((s) => (
                  <li key={s.id} className="break-words">
                    <a href={s.url} rel="noopener" className="underline underline-offset-4 hover:text-accent">{s.citation}</a>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="md:pt-16">
            {portrait ? (
              <figure>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={portrait.src}
                  srcSet={commonsSrcSet(portrait.src)}
                  sizes="(min-width: 768px) 240px, 100vw"
                  alt={portrait.alt}
                  width={portrait.width}
                  height={portrait.height}
                  loading="lazy"
                  decoding="async"
                  crossOrigin="anonymous"
                  className="sw-plate-light h-auto w-full grayscale"
                />
                <MediaCredit item={portrait} className="mt-2" />
              </figure>
            ) : (
              <p className="border border-dashed border-ink/25 p-4 text-[12.5px] leading-[1.6] text-graphite">
                No portrait. We show one only where its licence allows, and none was found for this person.
              </p>
            )}
          </aside>
        </div>
      </Container>
    </article>
  );
}
