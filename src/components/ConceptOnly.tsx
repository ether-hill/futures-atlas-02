import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";

/**
 * The page behind a `status: "concept"` project card.
 *
 * It says the thing plainly: there is nothing built yet. No mocked screens, no
 * invented findings, no "coming soon" that implies work in progress — a concept
 * is a question somebody wrote down, and the page shows the question and stops.
 * Anything more would be a claim the project has not earned.
 */
export function ConceptOnly({
  eyebrow,
  question,
  premise,
  sources = [],
  credit,
}: {
  eyebrow: string;
  /** The question the concept exists to ask. */
  question: string;
  /** Why it might be worth asking. One paragraph, no conclusions. */
  premise: string;
  /** Where the premise's claims come from. A concept still cites. */
  sources?: { label: string; href: string }[];
  /** Photo credit, where the card carries a licensed image. Rendered, not
   *  buried: the same rule the Magnifica portraits follow. */
  credit?: string;
}) {
  return (
    <section className="py-[clamp(56px,9vw,120px)]">
      <Container>
        <div className="max-w-[54ch]">
          <Reveal>
            <p className="eyebrow mb-5">{eyebrow}</p>
          </Reveal>
          <Reveal delay={70}>
            <h1 className="text-[clamp(30px,4.4vw,62px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink text-balance">
              {question}
            </h1>
          </Reveal>
          <Reveal delay={150}>
            <div className="mt-9 inline-flex items-center gap-2.5 border border-ink/25 px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.14em] text-ink/60">
              Concept only
            </div>
          </Reveal>
          <Reveal delay={210}>
            <p className="mt-7 text-[14px] leading-[1.8] text-ink-70">{premise}</p>
            <p className="mt-5 text-[13.5px] leading-[1.8] text-ink/50">
              Nothing has been built. There is no answer on this page because
              there is not one yet.
            </p>
          </Reveal>
          {sources.length > 0 && (
            <Reveal delay={250}>
              <p className="mt-9 font-mono text-[10.5px] uppercase tracking-[0.14em] text-ink/40">
                Where this comes from
              </p>
              <ul className="mt-3 flex flex-col gap-1.5">
                {sources.map((s) => (
                  <li key={s.label}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] leading-[1.7] text-ink/60 underline-offset-4 hover:text-ink hover:underline"
                    >
                      {s.label} <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Reveal>
          )}
          {credit && (
            <Reveal delay={265}>
              <p className="mt-7 text-[11.5px] leading-[1.7] text-ink/35">{credit}</p>
            </Reveal>
          )}
          <Reveal delay={280}>
            <Link
              href="/projects"
              className="mt-10 inline-flex items-center gap-2.5 font-mono text-[12.5px] uppercase tracking-[0.1em] text-accent underline-offset-4 hover:underline"
            >
              <span aria-hidden>←</span> Back to the projects
            </Link>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
