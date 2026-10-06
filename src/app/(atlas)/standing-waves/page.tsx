import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { NodalFigure } from "@/components/standing-waves/NodalFigure";
import { SPINE, SW_BASE, SW_TITLE } from "@/data/standing-waves/meta";
import { EVENTS } from "@/data/standing-waves/timeline";
import { PEOPLE } from "@/data/standing-waves/people";
import { SOURCES } from "@/data/standing-waves/sources";
import { ARTICLES } from "@/data/standing-waves/articles";
import { MEDIA } from "@/data/standing-waves/media";

export const metadata: Metadata = {
  title: `${SW_TITLE}. Futures Atlas`,
  description:
    "Cymatics and quantum mechanics share their wave mathematics. Where the parallel holds, where the walking-droplet experiments took it, and where it breaks. Every claim cited.",
  robots: { index: false },
};

const label = "font-mono text-[11px] uppercase tracking-[0.14em] text-graphite";

/** The hero: four plate modes crossfading, drawn on the server. */
const HERO = ["chladni:3,5", "bessel:4,2", "chladni:2,7", "bessel:6,1"];

export default function StandingWavesHome() {
  const verified = SOURCES.filter((s) => s.verified).length;
  const entries = [
    { href: `${SW_BASE}/timeline`, title: "Timeline", body: `${EVENTS.length} studies from 1680 to now, in four lanes, each with its status and its sources.` },
    { href: `${SW_BASE}/read`, title: "Read", body: `${ARTICLES.filter((a) => a.state === "published").length} articles. Each opens with what is established, what is contested and what is not supported.` },
    { href: `${SW_BASE}/gallery`, title: "Gallery", body: `${MEDIA.length} images: computed plate modes and historical plates, every one with its credit and licence.` },
    { href: `${SW_BASE}/simulator`, title: "Simulator", body: "A dish of water driven from below, computed in your browser. Nothing runs until you press start." },
    { href: `${SW_BASE}/people`, title: "People", body: `${PEOPLE.length} people, from Hooke's flour-covered glass to the MIT droplet lab.` },
    { href: `${SW_BASE}/sources`, title: "Sources", body: `${SOURCES.length} sources, ${verified} opened and checked. The rest say what is left to check.` },
  ];

  return (
    <>
      <section className="py-[clamp(40px,6vw,88px)]">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="max-w-[58ch]">
              <p className="eyebrow mb-5">Cymatics × quantum mechanics</p>
              <h1 className="text-[clamp(34px,5vw,68px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink text-balance">
                {SW_TITLE}
              </h1>
              <p className="mt-6 text-[17px] leading-[1.7] text-ink">
                Sprinkle sand on a metal plate, play a note, and the sand jumps into a pattern. An electron in an
                atom settles into shapes that follow the same kind of maths.
              </p>
              <p className="mt-4 text-[15px] leading-[1.8] text-ink-70">
                This project is about how far that likeness goes, and where it stops. It is all cited: every date,
                finding and picture links to where it came from.
              </p>
            </div>
            <figure className="mx-auto w-full max-w-[460px]">
              <div className="sw-hero-stack">
                {HERO.map((spec, i) => (
                  <NodalFigure key={spec} spec={spec} res={120} stroke={0.7} label={i === 0 ? "A computed Chladni figure: the lines where a vibrating plate stays still" : undefined} />
                ))}
              </div>
              <figcaption className={`${label} mt-3 text-center`}>
                Computed, not photographed: the lines where a vibrating plate stays still
              </figcaption>
            </figure>
          </div>
        </Container>
      </section>

      <section aria-labelledby="sw-spine" className="border-t border-ink/15 py-[clamp(40px,6vw,88px)]">
        <Container>
          <h2 id="sw-spine" className="text-[clamp(22px,2.4vw,32px)] font-extrabold tracking-[-0.015em] text-ink">
            Four things this project shows
          </h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SPINE.map((s) => (
              <li key={s.n} className="flex flex-col border-t-2 border-ink pt-4">
                <span className={label}>{s.n} · {s.short}</span>
                <p className="mt-3 flex-1 text-[15px] leading-[1.7] text-ink">{s.plain}</p>
                <Link href={s.href} className="mt-4 self-start border-b border-ink pb-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink hover:text-accent">
                  Read more →
                </Link>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section aria-labelledby="sw-entries" className="border-t border-ink/15 py-[clamp(40px,6vw,88px)]">
        <Container>
          <h2 id="sw-entries" className="sr-only">Sections</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((e) => (
              <Link key={e.href} href={e.href} className="fa-card fa-card--link sw-focus">
                <div className="fa-card__body">
                  <h3 className="fa-card__title">{e.title}</h3>
                  <p className="mt-3 text-[14px] leading-[1.7] text-ink-70">{e.body}</p>
                </div>
              </Link>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
