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

/* Screengrabs of work that lives outside the atlas registry. */
const ATLAS_THUMB = "/roadmap/futures-atlas-home.jpg";
const DELTAI_THUMB = "/roadmap/deltai-home.jpg";
const MAKEMODE_LOGO = "/roadmap/makemode-logo.png";
const DELTAI_SHOTS = [
  { src: DELTAI_THUMB, caption: "The site" },
  { src: "/roadmap/deltai-session.jpg", caption: "The session tool" },
];

/* Labels are the ones used in the room. Registry ids resolve to the atlas card
   image, so a new card image flows through here without a second edit; `src` is
   a literal path for work that sits outside the registry. */
type Item = { id?: string; src?: string; label: string; plus?: boolean; breakRow?: boolean };

const PHASE_1: Item[] = [
  { src: ATLAS_THUMB, label: "Futures Atlas site" },
  { id: "social-composer", label: "Social composer", plus: true },
  /* starts a fresh row, leaving the cell beside Social composer empty */
  { id: "odds-of-surviving-ai", label: "The Odds", breakRow: true },
  { id: "signal-reactor", label: "Signal Reactor" },
  { id: "quantum-spark", label: "Quantum Spark" },
  { id: "hollow-villages", label: "Village Oracle (without API)" },
  { id: "generatives", label: "Generatives" },
  { id: "swipe-the-future", label: "Swiper" },
];

const thumbFor = (id: string) => projects.find((p) => p.id === id)?.image;
const srcFor = (item: Item) => item.src ?? thumbFor(item.id ?? "");

/** Small inline thumbnail for the Phase 2 sub-lists. */
function MiniThumb({ src }: { src?: string }) {
  return (
    <span className="block h-8 w-12 shrink-0 overflow-hidden border border-ink/15 bg-haze">
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
  );
}

function ProjectTile({ item }: { item: Item }) {
  const src = srcFor(item);
  return (
    <li className={`flex flex-col${item.breakRow ? " min-[900px]:col-start-1" : ""}`}>
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
      <span className={`mt-2.5 flex items-baseline gap-1.5 font-display text-[13px] font-normal leading-[1.4] text-ink`}>
        {item.plus && (
          <span aria-hidden="true" className="text-accent-deep">
            +
          </span>
        )}
        {item.label}
      </span>
    </li>
  );
}

type Strand = { title: string; body: string; items: Item[] };

const PHASE_2: Strand[] = [
  {
    title: "Expanding Phase 1 projects",
    body: "Taking what launched further. Swiper, for example, could become a tool people run themselves: uploading or building their own question sets, then reviewing the data that comes back.",
    items: [
      { id: "signal-reactor", label: "Signal Reactor: branded presentation pages" },
      { id: "hollow-villages", label: "Village Oracle: API integration" },
      { id: "swipe-the-future", label: "Swiper: own sets, login, data overview" },
      { id: "hyperscale", label: "Hyperscale: finish" },
      { id: "quantum-spark", label: "Quantum Spark: scope to be confirmed" },
    ],
  },
  {
    title: "Expand Futures Atlas",
    body: "Continuing the prototyping approach from Phase 1: a broad set of pieces (speculative, exploratory, and tool-based) on compute power and how it might shape our future, spanning quantum, AI and beyond, drawing on TU Delft research and the “quantum for good” and quantum foresight framing.",
    items: [],
  },
  {
    title: "Agreed projects",
    body: "Work that sits outside the Futures Atlas, scoped and committed to up front.",
    items: [{ src: DELTAI_THUMB, label: "Workshop (DeltAI), led by Deborah" }],
  },
];

const VISION =
  "A platform exploring how computing power shapes what comes next. We build speculative, exploratory and tool-based pieces that make abstract technologies (quantum, AI and beyond) tangible enough to think and argue with.";

const TAGS = [
  "#quantum", "#quantumcomputing", "#AI", "#computing", "#technology", "#futures",
  "#foresight", "#emergingtech", "#speculativedesign", "#designfiction",
  "#responsibleinnovation", "#creativetechnology", "#quantumforgood", "#QDNL",
  "#TUDelft", "#quantumandsociety",
];

/* Each goal is a label plus its expansion, so the pairs render as titled cards
   rather than one long dash-separated line. */
const GOALS = [
  {
    title: "Reach and visibility",
    body: "Extend CQS and QDNL research beyond the existing quantum ecosystem, building science capital with audiences who wouldn’t otherwise encounter the field.",
  },
  {
    title: "Tools for the organisation",
    body: "Reusable pieces CQS can deploy in workshops, at events and with stakeholders, rather than one-off campaign assets.",
  },
  {
    title: "Ways for people to engage",
    body: "Interactive work that gives audiences something to do rather than read, building intuition through experience over explanation, and a sense of agency over technologies that feel remote.",
  },
  {
    title: "Emotional-moral deliberation",
    body: "Pieces designed to surface values and questions rather than transfer facts, opening space for people to articulate what a good life in a quantum-enabled society looks like.",
  },
  {
    title: "Bridging research and public",
    body: "Translating TU Delft and CQS output into forms non-specialists can enter without a physics background.",
  },
  {
    title: "Testing formats",
    body: "Each piece doubles as an experiment in what actually lands, with outcomes that can feed CQS’s impact evaluation work.",
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
    body: "Next stages of Swiper, or the Signal Reactor work he showed particular interest in. Otherwise projects of his choice, run in sprints as he requested.",
  },
];

const sectionCls = "border-t border-ink/15 py-[clamp(48px,8vw,110px)]";
const h2Cls =
  "text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink";
const h3Cls = "font-display text-[20px] font-extrabold leading-[1.2] tracking-[-0.015em] text-ink";
/* Prose runs in the display face; mono is kept for labels and data only. */
const introCls =
  "mt-5 max-w-[62ch] font-display text-[clamp(15px,1.7vw,18px)] font-normal leading-[1.65] text-ink-70";
const bodyCls = "font-display text-[15px] font-normal leading-[1.6] text-ink-70";
const labelCls =
  "font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-graphite";
/* Budget runs in the display face; the mono register stays on the rest of the page. */
const budgetLabelCls =
  "font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-graphite";

export default function RoadmapPage() {
  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="border-b border-ink/15 py-[clamp(56px,9vw,120px)]">
        <Container>
          <Reveal>
            <h1 className="max-w-[18ch] text-[clamp(36px,5.6vw,80px)] font-extrabold leading-[0.96] tracking-[-0.028em] text-ink text-balance">
              Futures Atlas + CQS
            </h1>
          </Reveal>
        </Container>
      </section>

      {/* ── Vision ──────────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <Container>
          <Reveal>
            <h2 className={h2Cls}>Vision</h2>
            <p className="mt-6 max-w-[46ch] text-[clamp(19px,2.4vw,30px)] font-extrabold leading-[1.25] tracking-[-0.018em] text-ink text-balance">
              {VISION}
            </p>
          </Reveal>
          <Reveal>
            <div className="mt-[clamp(28px,4vw,44px)] border-t border-ink/15 pt-6">
              <p className={labelCls}>Tags</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {TAGS.map((t) => (
                  <li
                    key={t}
                    className="border border-ink/15 px-3 py-1.5 font-display text-[13px] font-normal leading-none text-ink-70"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* ── Goals ───────────────────────────────────────────────────────── */}
      <section className={sectionCls}>
        <Container>
          <Reveal>
            <h2 className={h2Cls}>Goals</h2>
          </Reveal>
          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {GOALS.map((g, i) => (
              <Reveal key={g.title} delay={i * 70}>
                <div className="h-full border border-ink/15 p-6">
                  <h3 className={h3Cls}>{g.title}</h3>
                  <p className={`mt-4 ${bodyCls}`}>{g.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
                    <span className={budgetLabelCls}>Initial budget</span>
                    <span className="font-display text-[11px] font-medium text-ink/35">0{i + 1}</span>
                  </div>
                  <p className="font-condensed text-[clamp(40px,5vw,64px)] font-bold leading-[0.9] tracking-[-0.02em] text-ink">
                    {b.initial}
                  </p>
                  <p className={`mt-1 ${budgetLabelCls}`}>{b.label}</p>
                  <div className="mt-6 border-t border-ink/15 pt-4">
                    <p className="font-condensed text-[clamp(22px,2.4vw,30px)] font-bold leading-none text-accent-deep">
                      {b.remaining}
                    </p>
                    <p className={`mt-2 ${budgetLabelCls}`}>
                      Remaining{b.note ? ` (${b.note})` : ""}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="mt-3 border border-accent-deep bg-accent-soft p-[clamp(24px,3.5vw,40px)]">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.1em] text-accent-deep">
                Proposal
              </p>
              <p className="mt-4 max-w-[56ch] font-display text-[15px] font-normal leading-[1.6] text-ink-70">
                Fold the unspent €1.5k social budget into remaining work.
              </p>
              <p className="mt-4 max-w-[24ch] text-[clamp(26px,3.6vw,46px)] font-extrabold leading-[1.05] tracking-[-0.022em] text-ink text-balance">
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
            <h2 className={h2Cls}>Phase 1</h2>
            <p className={introCls}>
              The remaining €3.5k of work budget goes into finishing what already exists.
            </p>
          </Reveal>

          <div className="mt-[clamp(28px,4vw,48px)] grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr]">
            <Reveal>
              <div className="h-full border border-ink/15 p-[clamp(24px,3.5vw,40px)]">
                <h3 className={`${h3Cls} text-[clamp(19px,2vw,26px)]`}>Futures Atlas</h3>
                <p className={`mt-4 ${bodyCls}`}>
                  Getting everything launch-ready: bringing what already exists to a launchable
                  state, with no new scope this round.
                </p>
                <ul className="mt-7 grid grid-cols-2 gap-x-3 gap-y-5 min-[900px]:grid-cols-3">
                  {PHASE_1.map((item) => (
                    <ProjectTile key={item.label} item={item} />
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Its own track, not part of the launch push, so it reads a shade
                darker than the launch-ready list beside it. */}
            <Reveal delay={90} className="self-start">
              <div className="border border-ink/25 bg-haze p-[clamp(24px,3.5vw,40px)]">
                <h3 className={`${h3Cls} text-[clamp(19px,2vw,26px)]`}>Workshop (DeltAI)</h3>
                <p className={`mt-4 ${bodyCls}`}>
                  Explore output improvement, iterate based on feedback.
                </p>
                <div className="mt-7 flex flex-col gap-4">
                  {DELTAI_SHOTS.map((shot) => (
                    <figure key={shot.src}>
                      <span className="block aspect-[3/2] overflow-hidden border border-ink/15 bg-haze">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={shot.src}
                          alt=""
                          loading="lazy"
                          aria-hidden="true"
                          className="h-full w-full object-cover object-top"
                        />
                      </span>
                      <figcaption className={`mt-3 ${labelCls}`}>{shot.caption}</figcaption>
                    </figure>
                  ))}
                </div>
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
                    <ul className="mt-6 flex flex-col gap-3 border-t border-ink/15 pt-5">
                      {strand.items.map((item) => (
                        <li
                          key={item.label}
                          className={`flex items-center gap-3 ${bodyCls} text-[14px] text-ink`}
                        >
                          <MiniThumb src={item.src ?? thumbFor(item.id ?? "")} />
                          {item.label}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Reveal>
            ))}
          </div>

          {/* Cross-cutting, so it sits below the three strands rather than beside them. */}
          <Reveal>
            <div className="mt-3 border border-ink/15 bg-haze p-[clamp(24px,3.5vw,40px)]">
              <p className={labelCls}>Across every project</p>
              <h3 className={`mt-5 ${h3Cls}`}>Social</h3>
              <p className={`mt-4 max-w-[70ch] ${bodyCls}`}>
                Reach and visibility are a core goal: using the work to bring more people to
                quantum, computing and future scenarios. Social is the most direct route there, and
                each project has been considered for what it can carry.
              </p>
            </div>
          </Reveal>

          <Reveal>
            <div className="mt-3 border border-ink/15 bg-haze p-[clamp(24px,3.5vw,40px)]">
              <p className={labelCls}>Running across all three</p>
              <div className="mt-5 grid grid-cols-1 items-start gap-[clamp(20px,3vw,40px)] md:grid-cols-[1.4fr_1fr]">
                <div>
                  <h3 className={h3Cls}>Incorporate Makemode</h3>
                  <p className={`mt-4 max-w-[62ch] ${bodyCls}`}>
                    Adopting Derek&rsquo;s Makemode in place of some of the AI systems we currently use.
                  </p>
                </div>
                <figure>
                  <span className="flex items-center justify-center border border-ink/15 bg-paper px-8 py-7">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={MAKEMODE_LOGO}
                      alt="Makemode"
                      loading="lazy"
                      className="h-auto w-full max-w-[260px] object-contain"
                    />
                  </span>
                  <figcaption className={`mt-3 ${labelCls}`}>makemode.eu</figcaption>
                </figure>
              </div>
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
