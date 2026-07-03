import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { OutputTypeBadge } from "@/components/about/OutputTypeBadge";
import { SignalField } from "@/components/about/SignalField";
import { StackGrid } from "@/components/about/StackGrid";
import { WorkflowDiagram } from "@/components/about/WorkflowDiagram";
import {
  DOMAINS,
  FOOTER_CTA,
  HERO,
  OUTPUT_TYPES,
  STACK_INTRO,
  WORKFLOW_INTRO,
} from "@/content/about";

export const metadata: Metadata = {
  title: "About — Futures Atlas",
  description:
    "Futures Atlas is a showcase and prototype lab: frameworks and modular components for foresight around quantum computing, quantum applications, and emerging AI. It's meant to be used.",
};

export default function AboutPage() {
  return (
    <div>
      {/* ── Hero: the living atlas mark ─────────────────────────────────── */}
      <section className="relative flex min-h-[64svh] items-end overflow-hidden border-b border-ink/15">
        <SignalField />
        <Container className="relative z-[1] py-[clamp(72px,12vh,150px)]">
          <Reveal>
            <p className="eyebrow tick mb-6">{HERO.eyebrow}</p>
            <h1 className="max-w-[16ch] text-[clamp(40px,6.4vw,96px)] font-extrabold leading-[0.94] tracking-[-0.028em] text-ink text-balance">
              {HERO.headline}
            </h1>
            <p className="mt-7 max-w-[640px] font-mono text-[clamp(13px,1.4vw,15.5px)] leading-[1.8] text-ink-70">
              {HERO.standfirst}
            </p>
            <p className="mt-5 font-mono text-[clamp(15px,1.7vw,19px)] font-semibold text-accent-deep">
              {HERO.kicker}
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── What you'll find here ───────────────────────────────────────── */}
      <section className="py-[clamp(48px,8vw,110px)]">
        <Container>
          <Reveal>
            <h2 className="mb-[clamp(24px,4vw,44px)] text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
              What you&rsquo;ll find here
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {OUTPUT_TYPES.map((o, i) => (
              <Reveal key={o.type} delay={i * 90}>
                <div className="group h-full border border-ink/15 p-6 transition-colors hover:border-ink/45">
                  <div className="mb-4 flex items-center justify-between">
                    <OutputTypeBadge type={o.type} />
                    <span className="font-mono text-[11px] text-ink/35">0{i + 1}</span>
                  </div>
                  <h3 className="text-[20px] font-extrabold tracking-[-0.015em] text-ink">{o.title}</h3>
                  <p className="mt-3 font-mono text-[13px] leading-[1.75] text-ink-70">{o.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ── What we work on — sticky title, scrolling essays ─────────────── */}
      <section className="border-t border-ink/15 py-[clamp(48px,8vw,110px)]">
        <Container>
          <div className="grid grid-cols-1 gap-x-[clamp(24px,5vw,80px)] gap-y-8 lg:grid-cols-[1fr_1.6fr]">
            <div className="self-start lg:sticky lg:top-[calc(var(--fa-nav-h,64px)+28px)]">
              <Reveal>
                <h2 className="text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
                  {DOMAINS.intro}
                </h2>
                <p className="mt-6 font-mono text-[12.5px] uppercase tracking-[0.08em] text-accent-deep">
                  {DOMAINS.closing}
                </p>
              </Reveal>
            </div>
            <div className="flex flex-col divide-y divide-ink/10">
              {DOMAINS.items.map((d) => (
                <Reveal key={d.term} className="py-[clamp(20px,3vw,36px)] first:pt-0 last:pb-0">
                  <h3 className="text-[clamp(19px,2vw,26px)] font-extrabold tracking-[-0.018em] text-ink">
                    {d.term}
                  </h3>
                  <p className="mt-4 max-w-[68ch] font-mono text-[13.5px] leading-[1.85] text-ink-70">
                    {d.def}
                  </p>
                </Reveal>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── How things get made ─────────────────────────────────────────── */}
      <section className="border-t border-ink/15 py-[clamp(48px,8vw,110px)]">
        <Container>
          <Reveal>
            <h2 className="text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
              How things get made
            </h2>
            <p className="mt-5 max-w-[68ch] font-mono text-[13.5px] leading-[1.8] text-ink-70">
              {WORKFLOW_INTRO}
            </p>
          </Reveal>
          <div className="mt-[clamp(28px,4vw,48px)]">
            <Reveal>
              <WorkflowDiagram />
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── The stack ───────────────────────────────────────────────────── */}
      <section className="border-t border-ink/15 py-[clamp(48px,8vw,110px)]">
        <Container>
          <Reveal>
            <h2 className="text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
              The stack
            </h2>
            <p className="mt-5 max-w-[68ch] font-mono text-[13.5px] leading-[1.8] text-ink-70">{STACK_INTRO}</p>
          </Reveal>
          <div className="mt-[clamp(28px,4vw,48px)]">
            <StackGrid />
          </div>
        </Container>
      </section>

      {/* ── Footer CTA ──────────────────────────────────────────────────── */}
      <section className="border-t border-ink/15 py-[clamp(40px,6vw,80px)]">
        <Container>
          <Reveal>
            <Link
              href={FOOTER_CTA.href}
              className="inline-flex items-center gap-2.5 font-mono text-[14px] uppercase tracking-[0.1em] text-ink underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
            >
              {FOOTER_CTA.label} <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}
