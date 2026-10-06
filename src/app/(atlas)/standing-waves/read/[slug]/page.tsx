import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { SW_BASE, SW_TITLE, STATUS_LABEL } from "@/data/standing-waves/meta";
import { ARTICLES } from "@/data/standing-waves/articles";
import { SOURCES } from "@/data/standing-waves/sources";
import { EVENTS } from "@/data/standing-waves/timeline";
import { renderArticle } from "@/lib/standing-waves/cite";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  return { title: a ? `${a.title}. ${SW_TITLE}. Futures Atlas` : SW_TITLE, description: a?.standfirst, robots: { index: false } };
}

const label = "font-mono text-[11px] uppercase tracking-[0.14em] text-graphite";

export default async function ArticlePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) notFound();
  const idx = ARTICLES.indexOf(a);
  const next = ARTICLES.slice(idx + 1).concat(ARTICLES.slice(0, idx)).find((x) => x.state === "published" && x.slug !== a.slug);
  const rendered = a.body ? renderArticle(a.body) : null;
  const byId = new Map(SOURCES.map((s) => [s.id, s]));
  const related = (a.relatedEvents ?? []).map((id) => EVENTS.find((e) => e.id === id)!).filter(Boolean);

  return (
    <article className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="mx-auto max-w-[68ch]">
          <Link href={`${SW_BASE}/read`} className={`${label} hover:text-ink`}>← All articles</Link>
          <h1 className="mt-6 text-[clamp(28px,4vw,50px)] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink text-balance">
            {a.title}
          </h1>
          <p className="mt-5 text-[17px] leading-[1.7] text-ink">{a.standfirst}</p>

          {a.state === "coming" ? (
            <p className="mt-10 border-t border-ink/15 pt-6 text-[15px] leading-[1.8] text-ink-70">
              Not written yet. This article is planned and will appear here; nothing on this page stands in for it.
            </p>
          ) : (
            <>
              {a.box && (
                <dl className="sw-box mt-8 grid gap-4 p-5 sm:grid-cols-3">
                  <div>
                    <dt>{STATUS_LABEL.established}</dt>
                    <dd className="mt-2 text-[14px] leading-[1.6] text-ink">{a.box.established}</dd>
                  </div>
                  <div>
                    <dt>{STATUS_LABEL.contested}</dt>
                    <dd className="mt-2 text-[14px] leading-[1.6] text-ink">{a.box.contested}</dd>
                  </div>
                  <div>
                    <dt>Not supported</dt>
                    <dd className="mt-2 text-[14px] leading-[1.6] text-ink">{a.box.notSupported}</dd>
                  </div>
                </dl>
              )}
              {rendered && <div className="fa-prose mt-10" dangerouslySetInnerHTML={{ __html: rendered.html }} />}

              {related.length > 0 && (
                <section aria-labelledby="sw-related" className="mt-12 border-t border-ink/15 pt-6">
                  <h2 id="sw-related" className={label}>On the timeline</h2>
                  <ul className="mt-3 flex flex-col gap-2">
                    {related.map((e) => (
                      <li key={e.id}>
                        <Link href={`${SW_BASE}/timeline#${e.id}`} className="text-[14px] text-ink underline underline-offset-4 hover:text-accent">
                          {e.year} · {e.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {rendered && rendered.order.length > 0 && (
                <section aria-labelledby="sw-refs" className="mt-12 border-t border-ink/15 pt-6">
                  <h2 id="sw-refs" className={label}>Sources</h2>
                  <ol className="sw-refs mt-3 flex flex-col gap-3">
                    {rendered.order.map((id, i) => {
                      const s = byId.get(id)!;
                      return (
                        <li key={id} id={`ref-${i + 1}`} className="grid grid-cols-[2.2em_1fr] text-[13.5px] leading-[1.65] text-ink-70">
                          <a href={`#cite-${i + 1}`} className="font-mono text-accent-deep" aria-label={`Back to citation ${i + 1}`}>
                            {i + 1}
                          </a>
                          <span className="break-words">
                            <a href={s.url} rel="noopener" className="underline underline-offset-4 hover:text-accent">{s.citation}</a>
                            {s.openAccessUrl && (
                              <>
                                {" · "}
                                <a href={s.openAccessUrl} rel="noopener" className="underline underline-offset-4 hover:text-accent">free to read</a>
                              </>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}
            </>
          )}

          {next && (
            <Link href={`${SW_BASE}/read/${next.slug}`} className="fa-card fa-card--link sw-focus mt-14">
              <div className="fa-card__body">
                <span className="fa-card__meta">Next</span>
                <span className="fa-card__title mt-2">{next.title}</span>
              </div>
            </Link>
          )}
        </div>
      </Container>
    </article>
  );
}
