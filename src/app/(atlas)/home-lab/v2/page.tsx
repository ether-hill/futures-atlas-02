"use client";

/** V2 — "Observatory": Trajectories hero, workflow carousel, studies & papers. */

import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { STUDIES, WORKFLOW_SLIDES } from "@/components/homelab/data";
import { Carousel, LabBar, TrajectoriesBackdrop } from "@/components/homelab/shared";

export default function V2() {
  return (
    <div>
      <LabBar current={2} />

      {/* Hero — the Trajectories filament sphere, centered statement over it */}
      <section className="relative flex min-h-[88svh] items-center overflow-hidden border-b border-ink bg-black">
        <TrajectoriesBackdrop opacity={0.95} />
        {/* Left-side scrim (desktop) + flat darkening layer (mobile, where the
            bright filament core sits directly behind the statement) */}
        <div aria-hidden="true" className="absolute inset-0 hidden bg-[linear-gradient(95deg,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.55)_38%,transparent_62%)] md:block" />
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.55)_60%,rgba(0,0,0,0.3)_100%)] md:hidden" />
        <Container className="relative z-[1] py-[clamp(80px,14vh,160px)]">
          <Reveal>
            <p className="eyebrow mb-6 !text-paper/50">Futures Atlas</p>
            <h1 className="max-w-[14ch] text-[clamp(38px,6vw,88px)] font-extrabold leading-[0.96] tracking-[-0.028em] !text-paper text-balance">
              An observatory for possible worlds
            </h1>
            <p className="mt-6 max-w-[480px] font-mono text-[13.5px] leading-[1.8] text-paper/70">
              Instruments, simulations, and studies that make quantum and AI
              futures specific enough to argue with.
            </p>
            <div className="mt-9 flex gap-3">
              <Link href="/projects" className="rounded-[2px] bg-accent px-6 py-3.5 font-mono text-[12px] uppercase tracking-[0.1em] text-paper hover:bg-accent-deep">
                Enter the atlas
              </Link>
              <Link href="/about" className="rounded-[2px] border-[1.5px] border-paper/30 px-6 py-3 font-mono text-[12px] uppercase tracking-[0.1em] text-paper hover:border-paper">
                How it's made
              </Link>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Design-workflow carousel */}
      <section className="py-[clamp(44px,7vw,96px)]">
        <Container>
          <div className="grid grid-cols-1 gap-x-[clamp(28px,5vw,80px)] gap-y-8 lg:grid-cols-[1fr_1.5fr]">
            <Reveal>
              <h2 className="text-[clamp(26px,3.2vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
                How a project gets made
              </h2>
              <p className="mt-5 max-w-[46ch] font-mono text-[13px] leading-[1.8] text-ink-70">
                Six stages, documented for every project so the process is as
                replicatable as the output. The full interactive pipeline lives
                on the About page.
              </p>
              <Link href="/about#stack" className="mt-4 inline-block font-mono text-[11.5px] uppercase tracking-[0.12em] text-accent-deep hover:underline">
                See the full workflow →
              </Link>
            </Reveal>
            {/* min-w-0 lets the fr track shrink below the carousel's min-content
                width — without it the left column collapses to word-width */}
            <Reveal className="min-w-0">
              <Carousel intervalMs={5000}>
                {WORKFLOW_SLIDES.map((s) => (
                  <div key={s.step} className="border border-ink/15 bg-surface p-8 md:p-10">
                    <p className="font-mono text-[12px] uppercase tracking-[0.18em] text-accent-deep">{s.step}</p>
                    <p className="mt-4 max-w-[52ch] text-[clamp(17px,1.8vw,23px)] font-semibold leading-[1.4] tracking-[-0.01em] text-ink">
                      {s.body}
                    </p>
                  </div>
                ))}
              </Carousel>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* Published studies & white papers */}
      <section className="border-t border-ink/15 py-[clamp(44px,7vw,96px)]">
        <Container>
          <Reveal>
            <div className="mb-9 flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="text-[clamp(26px,3.2vw,44px)] font-extrabold tracking-[-0.022em] text-ink">Studies & white papers</h2>
              <span className="font-mono text-[12px] text-ink/50">Peer-shared research from the lab</span>
            </div>
            <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/15">
              {STUDIES.map((s) => (
                <article key={s.title} className="group grid grid-cols-1 gap-3 py-7 transition-colors hover:bg-panel md:grid-cols-[140px_1fr_auto] md:gap-8 md:px-4">
                  <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-deep">{s.kind}<br /><span className="text-ink/40">{s.date}</span></div>
                  <div>
                    <h3 className="max-w-[46ch] text-[clamp(18px,2vw,26px)] font-extrabold leading-[1.15] tracking-[-0.015em] text-ink group-hover:text-accent-deep">{s.title}</h3>
                    <p className="mt-2.5 max-w-[68ch] font-mono text-[12.5px] leading-[1.7] text-ink-70">{s.abstract}</p>
                  </div>
                  <div className="flex items-center gap-4 self-center font-mono text-[11.5px] uppercase tracking-[0.1em] text-ink/55">
                    <span>{s.pages} pp</span>
                    <span className="rounded-[2px] border border-ink/25 px-4 py-2 transition-colors group-hover:border-ink group-hover:text-ink">PDF ↓</span>
                  </div>
                </article>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
