import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { CoverageGrid } from "@/components/hegemony/CoverageGrid";
import { HeadlineFinding } from "@/components/hegemony/HeadlineFinding";
import { HeroMosaic } from "@/components/hegemony/HeroMosaic";
import { TimelineV2 } from "@/components/hegemony/TimelineV2";
import { VersionSwitch } from "@/components/hegemony/VersionSwitch";
import {
  DROPPED,
  FINDINGS,
  HEADLINE_FINDINGS,
  PRESS,
  TIMELINE,
  VIDEOS,
  countByTier,
} from "@/data/hegemony";

/**
 * The AI Hegemony investigation, second design.
 *
 * v1 is the complete record: all fifty-seven findings, all twenty-seven
 * rejects, every event. It is also, as a page, one long grid — a hundred-odd
 * bordered boxes at the same size, and by the third section the reader has
 * stopped distinguishing between them.
 *
 * v2 is an EDIT, not a rewrite. Same data file, same claims, same sources; it
 * simply refuses to show them all at once:
 *
 *   • eight findings at full size instead of fifty-seven in a grid, chosen in
 *     HEADLINE_IDS, each with its scope inline rather than behind a click;
 *   • the timeline sized by what each event is, so scale means something;
 *   • six videos and six articles, the rest on request;
 *   • the method and the rejects compressed to their numbers, with v1 one
 *     click away for anyone who wants the whole thing.
 *
 * Every tally on this page still counts the FULL set — 57, 27, 25 — precisely
 * because the page is showing you a fraction of it. A short edit that also
 * shrank its own numbers would be misrepresenting the evidence base, which is
 * the exact failure this report was written about.
 *
 * Both versions stay live at their own URLs (see VersionSwitch) so they can be
 * compared directly rather than from memory.
 */

export const metadata: Metadata = {
  title: "Whose Common Sense? (v2) — Futures Atlas",
  description:
    "The short edit: eight findings at full size, the timeline sized by what each event is, and the coverage six at a time. The complete 57-finding report is at /feed/ai-hegemony.",
  // Two designs of one report is a duplicate-content problem for a crawler;
  // v1 is the canonical, complete one.
  alternates: { canonical: "/feed/ai-hegemony" },
  robots: { index: false, follow: true },
};

export default function AiHegemonyV2Page() {
  return (
    <main className="pb-[clamp(60px,9vw,120px)]">
      <VersionSwitch current="v2" />

      {/* ── masthead ─────────────────────────────────────────────────── */}
      <section className="relative isolate flex min-h-[clamp(560px,80vh,860px)] items-start overflow-hidden bg-band">
        <HeroMosaic />
        <Container className="relative pb-[clamp(48px,8vw,96px)] pt-[clamp(32px,9vh,104px)]">
          <div className="max-w-[34rem]">
            <Link
              href="/feed"
              className="font-mono text-[11px] uppercase tracking-[0.16em] text-paper/60 underline-offset-4 hover:text-paper hover:underline"
            >
              ← The feed
            </Link>
            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              Investigation · the short edit
            </p>
            <h1 className="mt-4 max-w-[13ch] text-[clamp(36px,5.2vw,64px)] font-medium leading-[1.0] tracking-[-0.035em] text-paper">
              Whose common sense?
            </h1>
            <p className="mt-6 max-w-[46ch] text-[clamp(15px,1.6vw,18px)] leading-[1.6] tracking-[-0.005em] text-paper/90">
              Eight findings, in full. The other {FINDINGS.length - HEADLINE_FINDINGS.length} are
              in the{" "}
              <Link href="/feed/ai-hegemony" className="text-accent-deep underline underline-offset-4">
                complete report
              </Link>
              , with the {DROPPED.length} claims we checked and threw away.
            </p>
          </div>
        </Container>
      </section>

      {/* ── the one number the report turns on ───────────────────────────
          Not a card and not a chart: the whole argument compressed into two
          figures and the word between them. It is the section v1 needs a
          treemap and fifteen cards to make. */}
      <section className="border-b border-ink/[0.14] bg-surface py-[clamp(44px,6vw,84px)]">
        <Container>
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              01 · The disparity
            </p>
            <div className="mt-10 grid items-baseline gap-y-8 min-[900px]:grid-cols-[auto_auto_auto] min-[900px]:gap-x-12">
              <div>
                <p className="font-mono text-[clamp(56px,11vw,140px)] font-bold leading-[0.82] tracking-[-0.05em] text-ink/30">
                  41%
                </p>
                <p className="mt-4 max-w-[24ch] text-[14px] leading-[1.6] text-ink/60">
                  of the open web is English, as Common Crawl actually finds it
                </p>
              </div>
              <p
                aria-hidden
                className="hidden font-mono text-[clamp(28px,4vw,56px)] leading-none text-accent-deep min-[900px]:block"
              >
                →
              </p>
              <div>
                <p className="font-mono text-[clamp(56px,11vw,140px)] font-bold leading-[0.82] tracking-[-0.05em] text-accent-deep">
                  92.6%
                </p>
                <p className="mt-4 max-w-[24ch] text-[14px] leading-[1.6] text-ink/60">
                  of GPT-3&rsquo;s training mix was English, by word count, on OpenAI&rsquo;s own
                  numbers
                </p>
              </div>
            </div>
            <p className="mt-12 max-w-[54ch] text-[clamp(18px,2.4vw,26px)] font-medium leading-[1.35] tracking-[-0.02em] text-ink">
              That gap is not the web. It is filtering &mdash; which means it was a choice
              somebody made, and could have made differently.
            </p>
          </Reveal>
        </Container>
      </section>

      {/* ── the eight ────────────────────────────────────────────────── */}
      <section className="py-[clamp(44px,6vw,84px)]">
        <Container>
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              02 · The evidence
            </p>
            <h2 className="mt-4 max-w-[22ch] text-[clamp(28px,4vw,46px)] font-medium leading-[1.05] tracking-[-0.03em] text-ink">
              Eight of the {FINDINGS.length}, at full size
            </h2>
            <p className="mt-5 max-w-[64ch] text-[15px] leading-[1.75] text-ink/75">
              Every one carries the dataset, model and year it actually covers &mdash; inline
              here, rather than behind a click, because there are eight of them and no excuse.
              That scope line is the correction this report exists to make.
            </p>
          </Reveal>

          <div className="mt-10 space-y-[clamp(34px,4.5vw,58px)]">
            {HEADLINE_FINDINGS.map((f, i) => (
              <HeadlineFinding key={f.id} finding={f} index={i} />
            ))}
          </div>

          <Reveal className="mt-10 border-t border-ink/[0.14] pt-8">
            <Link
              href="/feed/ai-hegemony"
              className="group inline-flex flex-wrap items-baseline gap-x-3 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-deep"
            >
              <span className="group-hover:underline group-hover:underline-offset-4">
                All {FINDINGS.length} findings, {countByTier("documented")} of them peer-reviewed
                or primary →
              </span>
              <span className="text-ink/40">plus the {DROPPED.length} we rejected</span>
            </Link>
          </Reveal>
        </Container>
      </section>

      {/* ── the cadence ──────────────────────────────────────────────── */}
      <section className="border-t border-ink/[0.14] bg-surface py-[clamp(44px,6vw,84px)]">
        <Container>
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              03 · The feedback loop
            </p>
            <h2 className="mt-4 max-w-[20ch] text-[clamp(28px,4vw,46px)] font-medium leading-[1.05] tracking-[-0.03em] text-ink">
              Weeks to ship, months to answer
            </h2>
            <p className="mt-5 max-w-[64ch] text-[15px] leading-[1.75] text-ink/75">
              {TIMELINE.length} dated events. The releases are beats; the peer-reviewed findings
              are set large, because that is the asymmetry &mdash; and the honest surprise is how
              often labs documented their own bias and shipped anyway.
            </p>
          </Reveal>
          <TimelineV2 events={TIMELINE} />
        </Container>
      </section>

      {/* ── coverage ─────────────────────────────────────────────────── */}
      <section className="bg-band py-[clamp(44px,6vw,84px)]">
        <Container className="space-y-[clamp(40px,6vw,72px)]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              04 · Watch
            </p>
            <h2 className="mt-4 max-w-[24ch] text-[clamp(28px,4vw,46px)] font-medium leading-[1.05] tracking-[-0.03em] text-paper">
              The corpus, the labour, the answer
            </h2>
            <p className="mt-5 max-w-[64ch] text-[15px] leading-[1.75] text-paper/65">
              Nothing from YouTube reaches your browser until you press play.
            </p>
            <div className="mt-9">
              <CoverageGrid kind="video" items={VIDEOS} />
            </div>
          </div>

          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              05 · In the press
            </p>
            <h2 className="mt-4 max-w-[24ch] text-[clamp(28px,4vw,46px)] font-medium leading-[1.05] tracking-[-0.03em] text-paper">
              Selected coverage
            </h2>
            <p className="mt-5 max-w-[64ch] text-[15px] leading-[1.75] text-paper/65">
              Reporting we read while building this, and did not use as evidence for any claim
              above. Every card goes to the publisher&rsquo;s own page.
            </p>
            <div className="mt-9">
              <CoverageGrid kind="press" items={PRESS} />
            </div>
          </div>
        </Container>
      </section>

      {/* ── the way out ──────────────────────────────────────────────── */}
      <section className="py-[clamp(44px,6vw,84px)]">
        <Container>
          <Reveal className="max-w-[56ch]">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep">
              06 · The rest of it
            </p>
            <h2 className="mt-4 text-[clamp(26px,3.6vw,42px)] font-medium leading-[1.1] tracking-[-0.03em] text-ink">
              This page showed you {HEADLINE_FINDINGS.length}. There are {FINDINGS.length}.
            </h2>
            <p className="mt-5 text-[15px] leading-[1.75] text-ink/75">
              The complete report carries all of them across six strands, the three evidence
              tiers spelled out, and the {DROPPED.length} claims that were checked and thrown
              away &mdash; several of which were in the brief for this report. &ldquo;We looked
              and it didn&rsquo;t hold up&rdquo; is a finding, and it is published there rather
              than kept in a drawer.
            </p>
            <Link
              href="/feed/ai-hegemony"
              className="mt-8 inline-block border border-ink/25 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.16em] text-ink transition-colors hover:border-accent hover:text-accent-deep"
            >
              Read the complete report →
            </Link>
          </Reveal>
        </Container>
      </section>
    </main>
  );
}
