import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { Collaborators } from "@/components/about/Collaborators";
import { OutputTypeBadge } from "@/components/about/OutputTypeBadge";
import { SignalField } from "@/components/about/SignalField";
import { StackGrid } from "@/components/about/StackGrid";
import { TermField } from "@/components/about/TermField";
import { FOOTER_CTA, HERO, OPEN, OUTPUT_TYPES, STACK_INTRO, WORK } from "@/content/about";

export const metadata: Metadata = {
  title: "About. Futures Atlas",
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

      {/* ── Made with ───────────────────────────────────────────────────── */}
      <section className="border-t border-ink/15 py-[clamp(40px,6vw,80px)]">
        <Container>
          <Collaborators />
        </Container>
      </section>

      {/* ── What we work on: the vocabulary, as a turning graph ─────────── */}
      <section className="relative flex flex-col overflow-hidden border-t border-ink/15 md:min-h-[min(780px,86svh)] md:justify-center">
        <Container className="relative z-[2] pt-[clamp(48px,8vw,110px)] pb-6 md:pb-[clamp(48px,8vw,110px)]">
          <Reveal>
            <div className="max-w-[46ch]">
              <h2 className="text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
                {WORK.intro}
              </h2>
              <p className="mt-6 font-mono text-[13.5px] leading-[1.85] text-ink-70">{WORK.body}</p>
              <p className="mt-6 font-mono text-[12.5px] leading-[1.75] text-ink/50">{WORK.note}</p>
              <p className="mt-6 font-mono text-[12.5px] uppercase tracking-[0.08em] text-accent-deep">
                {WORK.closing}
              </p>
            </div>
          </Reveal>
        </Container>
        {/*
          The field is a block of its own on a phone (a backdrop there would
          just sit under the paragraph and make both unreadable) and the
          section's backdrop from md up.
        */}
        <div className="relative z-0 h-[112vw] max-h-[540px] w-full pb-[clamp(32px,6vw,64px)] md:absolute md:inset-0 md:h-auto md:max-h-none md:pb-0">
          <TermField />
        </div>
        {/* Reading scrim: fades the left of the field into the page ground so
            the terms behind the copy read as texture, not competition. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 z-[1] hidden w-full bg-gradient-to-r from-surface from-14% via-surface/80 via-28% to-transparent to-46% md:block"
        />
      </section>

      {/* ── The stack ───────────────────────────────────────────────────── */}
      <section id="stack" className="scroll-mt-20 border-t border-ink/15 py-[clamp(48px,8vw,110px)]">
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

      {/* ── Open by default ─────────────────────────────────────────────── */}
      <section className="border-t border-ink/15 py-[clamp(48px,8vw,110px)]">
        <Container>
          <div className="grid grid-cols-1 gap-x-[clamp(24px,5vw,80px)] gap-y-10 lg:grid-cols-[1fr_1.6fr]">
            <Reveal>
              <p className="eyebrow tick mb-5">{OPEN.eyebrow}</p>
              <h2 className="text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
                {OPEN.intro}
              </h2>
            </Reveal>
            <div>
              <Reveal>
                <p className="max-w-[68ch] font-mono text-[13.5px] leading-[1.8] text-ink-70">{OPEN.body}</p>
              </Reveal>
              <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {OPEN.licences.map((l, i) => (
                  <Reveal key={l.thing} delay={i * 90}>
                    <div className="flex h-full flex-col justify-between border border-ink/15 p-5">
                      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink/45">
                        {l.thing}
                      </span>
                      <span className="mt-6 block text-[19px] font-extrabold tracking-[-0.015em] text-ink">
                        {l.licence}
                      </span>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal>
                <div className="mt-8 flex flex-col items-start gap-3">
                  <Link
                    href={OPEN.cta.href}
                    className="font-mono text-[13px] leading-[1.7] text-accent-deep underline-offset-4 transition-colors hover:underline"
                  >
                    {OPEN.cta.label}&nbsp;<span aria-hidden="true">→</span>
                  </Link>
                  <a
                    href={OPEN.repo.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-[13px] leading-[1.7] text-ink/55 underline-offset-4 transition-colors hover:text-ink hover:underline"
                  >
                    {OPEN.repo.label}&nbsp;<span aria-hidden="true">↗</span>
                  </a>
                </div>
              </Reveal>
            </div>
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
