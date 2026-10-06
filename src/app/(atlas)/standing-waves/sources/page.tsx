import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { SW_TITLE } from "@/data/standing-waves/meta";
import { SOURCES } from "@/data/standing-waves/sources";
import { EVENTS } from "@/data/standing-waves/timeline";
import { PEOPLE } from "@/data/standing-waves/people";
import { ARTICLES } from "@/data/standing-waves/articles";
import { citedIds } from "@/lib/standing-waves/cite";

export const metadata: Metadata = {
  title: `Sources. ${SW_TITLE}. Futures Atlas`,
  description: "The full bibliography for Standing Waves, generated from the project's data, with what has been checked and what has not.",
  robots: { index: false },
};

/** Sorted by citation, which leads with the first author's surname. */
export default function SourcesPage() {
  const sorted = [...SOURCES].sort((a, b) => a.citation.localeCompare(b.citation));
  const usedBy = (id: string) => {
    const n =
      EVENTS.filter((e) => e.sourceIds.includes(id)).length +
      PEOPLE.filter((p) => p.sourceIds.includes(id)).length +
      ARTICLES.filter((a) => citedIds(a.body ?? "").includes(id)).length;
    return n;
  };
  const unverified = sorted.filter((s) => !s.verified);

  return (
    <section className="py-[clamp(36px,5vw,72px)]">
      <Container>
        <div className="max-w-[62ch]">
          <p className="eyebrow mb-4">Sources</p>
          <h1 className="text-[clamp(28px,4vw,52px)] font-extrabold leading-[1.04] tracking-[-0.02em] text-ink">Bibliography</h1>
          <p className="mt-5 text-[15px] leading-[1.8] text-ink-70">
            Every source the project cites, built from the same data the pages use, so nothing can be cited that is
            not listed here. A source is marked checked only once its link has been opened and its author, title,
            year and journal compared against it. {SOURCES.length - unverified.length} of {SOURCES.length} are checked.
            {unverified.length > 0 && " The rest say what is still to be done."}
          </p>
        </div>
        <ol className="mt-10 flex max-w-[80ch] flex-col">
          {sorted.map((s) => (
            <li key={s.id} id={s.id} className="border-t border-ink/15 py-4">
              <p className="text-[14.5px] leading-[1.7] text-ink break-words">{s.citation}</p>
              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-[0.1em] text-graphite">
                <a href={s.url} rel="noopener" className="text-ink underline underline-offset-4 hover:text-accent">
                  Source
                </a>
                {s.openAccessUrl && (
                  <a href={s.openAccessUrl} rel="noopener" className="text-ink underline underline-offset-4 hover:text-accent">
                    Free to read
                  </a>
                )}
                <span>{s.verified ? "Checked" : "Not yet checked"}</span>
                <span>Cited {usedBy(s.id)}×</span>
              </p>
              {!s.verified && s.todo && <p className="mt-2 text-[13px] leading-[1.6] text-ink-70">To do: {s.todo}</p>}
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
