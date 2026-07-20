import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Futures Atlas + CQS",
  robots: { index: false, follow: false },
};

const BUDGET = [
  { label: "Work", initial: "€10k", remaining: "€2k", note: null },
  { label: "AI / API", initial: "€1.5k", remaining: "€500", note: "to apply across projects" },
  { label: "Social", initial: "€1.5k", remaining: "€1.5k", note: "unspent, social not started" },
];

/* Labels are the ones used in the room; thumbnails come from the atlas registry
   by id, so a new card image flows through here without a second edit. */
const PHASE_1: { id: string; label: string }[] = [
  { id: "odds-of-surviving-ai", label: "The Odds" },
  { id: "signal-reactor", label: "Signal Reactor" },
  { id: "quantum-spark", label: "Quantum Spark" },
  { id: "hollow-villages", label: "Village Oracle (without API)" },
  { id: "generatives", label: "Generatives" },
  { id: "swipe-the-future", label: "Swiper" },
];
const PHASE_1_PLUS = { id: "social-composer", label: "Social composer" };

const thumbFor = (id: string) => projects.find((p) => p.id === id)?.image;

function ProjectTile({ id, label, plus = false }: { id: string; label: string; plus?: boolean }) {
  const src = thumbFor(id);
  return (
    <li className="flex flex-col">
      <span className="block aspect-[3/2] overflow-hidden border border-ink/15 bg-haze">
        {src && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            loading="lazy"
            aria-hidden="true"
            className="h-full w-full object-cover object-top"
          />
        )}
      </span>
      <span className={`mt-3 flex items-baseline gap-2 ${bodyCls} text-ink`}>
        {plus && (
          <span aria-hidden="true" className="text-accent-deep">
            +
          </span>
        )}
        {label}
      </span>
    </li>
  );
}

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
    items: ["Workshop (DeltAI) — Deborah"],
  },
  {
    title: "New prototypes & explorations",
    body: "Continuing the prototyping approach from Phase 1. Speculative pieces around computing, futures and technology, with a stronger quantum weighting — drawing on TU Delft research, “quantum for good” and quantum vision/foresight framing.",
    items: [],
  },
];

/* Diedrick sits last: his strand is the one still to be settled. */
const TEAM = [
  { name: "Deborah", body: "The Workshop (DeltAI)." },
  {
    name: "Derek",
    body: "Trialling Makemode instead of Claude for projects, plus other projects of his choice.",
  },
  {
    name: "Diedrick",
    body: "Next stages of Swiper, or the Signal Reactor work he showed particular interest in; otherwise projects of his choice, run in sprints as he requested.",
  },
];

const sectionCls = "border-t border-ink/15 py-[clamp(48px,8vw,110px)]";
const h2Cls =
  "text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink";
const h3Cls = "font-display text-[20px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink";
/* Prose runs in the display face — mono is kept for labels and data only. */
const introCls =
  "mt-5 max-w-[62ch] font-display text-[clamp(15px,1.7vw,18px)] font-normal leading-[1.65] text-ink-70";
const bodyCls = "font-display text-[15px] font-normal leading-[1.6] text-ink-70";
const labelCls = "font-mono text-[10.5px] uppercase tracking-[0.14em] text-graphite";

export default function RoadmapPage() {
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/15 py-[clamp(56px,9vw,120px)]">
        <Container>
          <Reveal>
            <p className="eyebrow tick mb-6">Internal — not for circulation</p>
            <h1 className="max-w-[18ch] text-[clamp(36px,5.6vw,80px)] font-extrabold leading-[0.96] tracking-[-0.028em] text-ink text-balance">
              Futures Atlas + CQS
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
                    <span className={labelCls}>{b.label}</span>
                    <span className="font-mono text-[11px] text-ink/35">0{i + 1}</span>
                  </div>
                  <p className="font-condensed text-[clamp(40px,5vw,64px)] font-bold leading-[0.9] tracking-[-0.02em] text-ink">
                    {b.initial}
                  </p>
                  <p className={`mt-1 ${labelCls}`}>Initial budget</p>
                  <div className="mt-6 border-t border-ink/15 pt-4">
                    <p className="font-condensed text-[clamp(22px,2.4vw,30px)] font-bold leading-none text-accent-deep">
                      {b.remaining}
                    </p>
                    <p className={`mt-2 ${labelCls}`}>
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
              <p className="mt-4 max-w-[24ch] text-[clamp(26px,3.6vw,46px)] font-extrabold leading-[1.05] tracking-[-0.022em] text-ink text-balance">
                Available: €3.5k work plus €500 in AI credits.
              </p>
              <p className="mt-5 max-w-[52ch] font-mono text-[12.5px] leading-[1.7] text-ink-70">
                Fold the unspent €1.5k social budget into remaining work.
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
              Bring what already exists to a launchable state — no new scope this round. We&rsquo;re
              aiming to launch around September, September at the earliest.
            </p>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <div className="h-full border border-ink/15 p-[clamp(24px,3.5vw,40px)]">
                <p className={labelCls}>Futures Atlas</p>
                <ul className="mt-6 grid grid-cols-1 gap-x-4 gap-y-6 min-[520px]:grid-cols-2">
                  {PHASE_1.map((item) => (
                    <ProjectTile key={item.id} id={item.id} label={item.label} />
                  ))}
                  <ProjectTile id={PHASE_1_PLUS.id} label={PHASE_1_PLUS.label} plus />
                </ul>
              </div>
            </Reveal>

            {/* Its own track — not part of the launch push, so it reads a shade
                darker than the launch-ready list beside it. */}
            <Reveal delay={90} className="self-start">
              <div className="border border-ink/25 bg-haze p-[clamp(24px,3.5vw,40px)]">
                <p className={labelCls}>Own track — not part of the launch push</p>
                <h3 className={`mt-5 ${h3Cls} text-[clamp(19px,2vw,26px)]`}>Workshop (DeltAI)</h3>
                <p className={`mt-4 ${bodyCls}`}>
                  Runs alongside the Futures Atlas projects, with Deborah leading. Its Phase 1 is to
                  begin the next phase of the work: improving the output.
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
            <h2 className={h2Cls}>Phase 2</h2>
            <p className={introCls}>Three equal strands of work.</p>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 md:grid-cols-3">
            {PHASE_2.map((strand, i) => (
              <Reveal key={strand.title} delay={i * 90}>
                <div className="flex h-full flex-col border border-ink/15 p-6">
                  <h3 className={h3Cls}>{strand.title}</h3>
                  <p className={`mt-4 ${bodyCls}`}>{strand.body}</p>
                  {strand.items.length > 0 && (
                    <ul className="mt-6 flex flex-col gap-2.5 border-t border-ink/15 pt-5">
                      {strand.items.map((item) => (
                        <li
                          key={item}
                          className={`flex items-baseline gap-2.5 ${bodyCls} text-[14px] text-ink`}
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
              <p className={labelCls}>Running across all three</p>
              <h3 className={`mt-5 ${h3Cls}`}>Incorporate Makemode</h3>
              <p className={`mt-4 max-w-[62ch] ${bodyCls}`}>
                Derek&rsquo;s Makemode, to be incorporated in place of some of the AI systems we
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
                  <h3 className={h3Cls}>{person.name}</h3>
                  <p className={`mt-3 ${bodyCls}`}>{person.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </div>
  );
}
