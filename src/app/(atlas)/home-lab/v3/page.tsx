"use client";

/** V3 — "Journal": editorial front page — news carousel, research, pull quote. */

import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { projectsOrdered } from "@/data/projects";
import { ARTICLES, STUDIES } from "@/components/homelab/data";
import { Backdrop, LabBar, ScrollRow } from "@/components/homelab/shared";

export default function V3() {
  const lead = projectsOrdered[0];
  return (
    <div>
      <LabBar current={3} />

      {/* Masthead — physarum growth behind a newspaper-flag treatment */}
      <section className="relative overflow-hidden border-b border-ink bg-black">
        {/* physarum renders black in this embed build — differential-growth gives the
            same organic-growth filaments (green/gold on black) and reliably paints */}
        <Backdrop
          spec={{
            pieceId: "differential-growth",
            seed: "journal",
            params: { flow: 0.5, fieldScale: 1.6, lineWidth: 1.2 },
            meta: { complexity: 0.9, chaos: 0.55 },
            colors: { bg: "#05060a", lo: "#57e88f", hi: "#ffd166" },
          }}
          opacity={0.6}
        />
        <Container className="relative z-[1] py-[clamp(48px,8vh,96px)]">
          <Reveal>
            {/* dateline row — flag furniture */}
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-2.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-paper/55">
              <span>Futures Atlas — the foresight lab</span>
              <span>Vol. 02 · July 2026</span>
            </div>
            {/* border-paper/* utilities don't resolve in this build — bg-paper + opacity does */}
            <div className="h-px w-full bg-paper opacity-40" aria-hidden="true" />
            <div className="flex flex-wrap items-end justify-between gap-6 pb-6 pt-7">
              <h1 className="text-[clamp(40px,7vw,110px)] font-extrabold leading-[0.9] tracking-[-0.03em] !text-paper">
                The Atlas Journal
              </h1>
              <p className="max-w-[300px] pb-2 font-mono text-[11.5px] leading-[1.7] text-paper/60">
                Notes, evidence, and working papers from the foresight lab. Published irregularly, cited always.
              </p>
            </div>
            {/* newspaper double rule under the flag */}
            <div className="h-[3px] w-full bg-paper opacity-90" aria-hidden="true" />
            <div className="mt-[4px] h-px w-full bg-paper opacity-60" aria-hidden="true" />
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 font-mono text-[11px] uppercase tracking-[0.16em] text-paper/50">
              {["Rhetoric watch", "Field notes", "Methods", "Build logs", "Research"].map((s, i) => (
                <span key={s} className="flex items-center gap-x-4">
                  {i > 0 && <span aria-hidden="true" className="text-paper/25">·</span>}
                  <span>{s}</span>
                </span>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>

      {/* News & articles carousel (horizontal scroll) */}
      <section className="py-[clamp(44px,7vw,96px)]">
        <Container>
          <Reveal>
            <ScrollRow title="Latest from the journal">
              {ARTICLES.map((a) => (
                <article key={a.title} className="group flex w-[min(78vw,380px)] shrink-0 snap-start flex-col border border-ink/15 p-6 transition-colors hover:border-ink/50">
                  <div className="flex items-baseline justify-between font-mono text-[10.5px] uppercase tracking-[0.14em]">
                    <span className="text-accent-deep">{a.tag}</span>
                    <span className="text-ink/40">{a.date} · {a.read}</span>
                  </div>
                  <h3 className="mt-4 text-[20px] font-extrabold leading-[1.15] tracking-[-0.015em] text-ink group-hover:text-accent-deep">{a.title}</h3>
                  <p className="mt-3 font-mono text-[12.5px] leading-[1.7] text-ink-70">{a.dek}</p>
                  <span className="mt-auto pt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/55 group-hover:text-ink">Read →</span>
                </article>
              ))}
            </ScrollRow>
          </Reveal>
        </Container>
      </section>

      {/* Pull quote + lead project */}
      <section className="border-t border-ink/15 bg-band py-[clamp(44px,7vw,96px)] text-paper">
        <Container>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.3fr_1fr]">
            <Reveal>
              <p className="text-[clamp(24px,3.4vw,46px)] font-extrabold leading-[1.15] tracking-[-0.02em] !text-paper">
                “Imagine freely; cite everything. Nothing in the atlas is invented
                where it claims to be real.”
              </p>
              <p className="mt-5 font-mono text-[12px] uppercase tracking-[0.16em] text-paper/50">The house rule</p>
            </Reveal>
            {lead?.image && (
              <Reveal>
                <Link href={lead.path ?? "/projects"} className="group block border border-paper/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lead.image} alt="" className="aspect-[3/2] w-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
                  <div className="flex items-center justify-between p-4 font-mono text-[11.5px] uppercase tracking-[0.12em]">
                    <span className="text-paper">{lead.title}</span>
                    <span className="text-paper/60 group-hover:text-paper">Visit →</span>
                  </div>
                </Link>
              </Reveal>
            )}
          </div>
        </Container>
      </section>

      {/* Featured research */}
      <section className="py-[clamp(44px,7vw,96px)]">
        <Container>
          <Reveal>
            <h2 className="mb-8 text-[clamp(24px,3vw,40px)] font-extrabold tracking-[-0.02em] text-ink">Published research</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {STUDIES.map((s) => (
                <article key={s.title} className="group flex flex-col border border-ink/15 p-6 transition-colors hover:border-ink/50">
                  <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-accent-deep">{s.kind} · {s.date}</span>
                  <h3 className="mt-3 text-[18px] font-extrabold leading-[1.2] tracking-[-0.012em] text-ink">{s.title}</h3>
                  <p className="mt-3 flex-1 font-mono text-[12px] leading-[1.65] text-ink-70">{s.abstract}</p>
                  <span className="mt-5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink/55 group-hover:text-ink">{s.pages} pp · Download ↓</span>
                </article>
              ))}
            </div>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
