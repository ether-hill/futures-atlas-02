import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "CQS — Phase 1 & Phase 2",
  robots: { index: false, follow: false },
};

const BUDGET = [
  { label: "Work", allocated: "€10k", remaining: "€2k", note: null },
  { label: "AI / API", allocated: "€1.5k", remaining: "€500", note: "applied across projects" },
  { label: "Social", allocated: "€1.5k", remaining: "€1.5k", note: "unspent, social not started" },
];

const PHASE_1 = [
  "The Odds",
  "Signal Reactor",
  "Quantum Spark",
  "Village Oracle (without API)",
  "Generatives",
  "Swiper",
];

const PHASE_2 = [
  {
    title: "Expanding Phase 1 projects",
    body: "Taking what launched further. Swiper, for example, could become a tool people use themselves — uploading or building their own question sets, and reviewing the data that comes back.",
    items: [
      "Signal Reactor — branded presentation pages",
      "Village Oracle — API integration",
      "Swiper — own sets, login, data overview",
      "Hyperscale — finish",
      "Quantum Spark — scope TBD",
    ],
  },
  {
    title: "Agreed projects",
    body: "Larger, more defined pieces scoped and committed to up front, rather than explored.",
    items: ["Workshop tool (DeltAI) — Deborah"],
  },
  {
    title: "New prototypes & explorations",
    body: "Continuing the prototyping approach from Phase 1. Speculative pieces around computing, futures and technology, with a stronger quantum weighting — drawing on TU Delft research, “quantum for good” and quantum vision/foresight framing.",
    items: [],
  },
];

const TEAM = [
  { name: "Deborah", body: "The Workshop tool." },
  {
    name: "Diedrick",
    body: "Next stages of Swiper, or the Signal Reactor work he showed particular interest in; otherwise projects of his choice, run in sprints as he requested.",
  },
  {
    name: "Derek",
    body: "Trialling Makemode instead of Claude for projects, plus other projects of his choice.",
  },
];

const sectionCls = "border-t border-ink/15 py-[clamp(48px,8vw,110px)]";
const h2Cls =
  "text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink";
const introCls = "mt-5 max-w-[68ch] font-mono text-[13.5px] leading-[1.8] text-ink-70";

export default function RoadmapPage() {
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/15 py-[clamp(56px,9vw,120px)]">
        <Container>
          <Reveal>
            <p className="eyebrow tick mb-6">Internal — not for circulation</p>
            <h1 className="max-w-[18ch] text-[clamp(36px,5.6vw,80px)] font-extrabold leading-[0.96] tracking-[-0.028em] text-ink text-balance">
              CQS — Phase 1 &amp; Phase 2
            </h1>
          </Reveal>
        </Container>
      </section>

      {/* ── 1. Budget ───────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <Container>
          <Reveal>
            <h2 className={h2Cls}>Budget</h2>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 md:grid-cols-3">
            {BUDGET.map((b, i) => (
              <Reveal key={b.label} delay={i * 90}>
                <div className="h-full border border-ink/15 p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite">
                      {b.label}
                    </span>
                    <span className="font-mono text-[11px] text-ink/35">0{i + 1}</span>
                  </div>
                  <p className="font-condensed text-[clamp(40px,5vw,64px)] font-bold leading-[0.9] tracking-[-0.02em] text-ink">
                    {b.allocated}
                  </p>
                  <p className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite">
                    Allocated
                  </p>
                  <div className="mt-6 border-t border-ink/15 pt-4">
                    <p className="font-condensed text-[clamp(22px,2.4vw,30px)] font-bold leading-none text-accent-deep">
                      {b.remaining}
                    </p>
                    <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite">
                      Remaining{b.note ? ` — ${b.note}` : ""}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-3 border border-accent-deep bg-accent-soft p-[clamp(24px,3.5vw,40px)]">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-accent-deep">
                Proposal
              </p>
              <p className="mt-4 max-w-[60ch] text-[clamp(18px,2.1vw,26px)] font-extrabold leading-[1.25] tracking-[-0.015em] text-ink">
                Fold the unspent €1.5k social budget into remaining work.
              </p>
              <p className="mt-4 font-mono text-[13.5px] leading-[1.8] text-ink-70">
                Available: €3.5k work plus €500 in AI credits.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 2. Phase 1 ──────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <Container>
          <Reveal>
            <h2 className={h2Cls}>Phase 1 — get everything launch-ready</h2>
            <p className={introCls}>
              Bring what already exists to a launchable state — no new scope this round.
            </p>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <div className="h-full border border-ink/15 p-[clamp(24px,3.5vw,40px)]">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite">
                  Futures Atlas
                </p>
                <ul className="mt-6 flex flex-col divide-y divide-ink/10">
                  {PHASE_1.map((item) => (
                    <li
                      key={item}
                      className="flex items-baseline gap-3 py-3.5 first:pt-0 font-mono text-[14px] leading-[1.6] text-ink"
                    >
                      <span aria-hidden="true" className="text-ink/30">
                        —
                      </span>
                      {item}
                    </li>
                  ))}
                  <li className="flex items-baseline gap-3 py-3.5 font-mono text-[14px] leading-[1.6] text-ink">
                    <span aria-hidden="true" className="text-accent-deep">
                      +
                    </span>
                    Social composer
                  </li>
                </ul>
              </div>
            </Reveal>

            <Reveal delay={90}>
              <div className="h-full border border-ink bg-band p-[clamp(24px,3.5vw,40px)]">
                <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-paper/60">
                  Own track
                </p>
                <p className="mt-5 text-[clamp(19px,2vw,26px)] font-extrabold leading-[1.15] tracking-[-0.018em] text-paper">
                  Workshop tool (DeltAI)
                </p>
                <p className="mt-4 font-mono text-[13px] leading-[1.8] text-paper/75">
                  Runs as its own track alongside the Futures Atlas projects, with Deborah leading.
                </p>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* ── 3. Phase 2 ──────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <Container>
          <Reveal>
            <h2 className={h2Cls}>Phase 2 — approx. September</h2>
            <p className={introCls}>Three equal strands of work.</p>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 md:grid-cols-3">
            {PHASE_2.map((strand, i) => (
              <Reveal key={strand.title} delay={i * 90}>
                <div className="flex h-full flex-col border border-ink/15 p-6">
                  <h3 className="text-[20px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink">
                    {strand.title}
                  </h3>
                  <p className="mt-4 font-mono text-[13px] leading-[1.75] text-ink-70">
                    {strand.body}
                  </p>
                  {strand.items.length > 0 && (
                    <ul className="mt-6 flex flex-col gap-2.5 border-t border-ink/15 pt-5">
                      {strand.items.map((item) => (
                        <li
                          key={item}
                          className="flex items-baseline gap-2.5 font-mono text-[12.5px] leading-[1.6] text-ink"
                        >
                          <span aria-hidden="true" className="text-ink/30">
                            —
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-3 border border-ink/15 bg-haze p-[clamp(24px,3.5vw,40px)]">
              <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite">
                Running across all three
              </p>
              <p className="mt-4 max-w-[60ch] text-[clamp(17px,1.9vw,23px)] font-extrabold leading-[1.25] tracking-[-0.015em] text-ink">
                Derek&rsquo;s Makemode — to be incorporated in place of some of the AI systems we
                currently use.
              </p>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── 4. Team ─────────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <Container>
          <Reveal>
            <h2 className={h2Cls}>Team</h2>
            <p className={introCls}>
              Deborah, Diedrick and Derek are all communicators on the project. Beyond that, each
              takes on something they&rsquo;re particularly invested in.
            </p>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 md:grid-cols-3">
            {TEAM.map((person, i) => (
              <Reveal key={person.name} delay={i * 90}>
                <div className="h-full border border-ink/15 p-6">
                  <h3 className="text-[20px] font-extrabold tracking-[-0.015em] text-ink">
                    {person.name}
                  </h3>
                  <p className="mt-3 font-mono text-[13px] leading-[1.75] text-ink-70">
                    {person.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
