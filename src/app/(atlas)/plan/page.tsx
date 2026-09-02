import type { Metadata } from "next";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Plan. Futures Atlas",
  description: "What ships at launch, and what happens in the three months after it.",
  robots: { index: false },
};

/**
 * The launch plan, for reading out in a room.
 *
 * Internal, like the rest of the staging-only column: it is the schedule the
 * work is being run against, not a page about the Atlas. The middleware keeps
 * /plan off production entirely (STAGING_ONLY), so the only way to it is a
 * signed-in preview build.
 *
 * The shape is three tracks — website, projects, social — carried across four
 * months, and the layout says so: each month is a row, each track a column, so
 * a reader can follow one track down the page or one month across it.
 */

const head = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep";

const CORE = ["Home", "About", "Contact", "Developer", "Projects (index)"];

const PROJECTS = [
  "Swipe the Future",
  "Generatives",
  "The Odds",
  "Interference",
  "Glossary",
  "6th, once named",
];

type Track = {
  track: string;
  body: string[];
  /** An inventory that belongs to this track, listed inside its card. */
  list?: { label: string; items: string[] };
};

const MONTHS: { n: string; name: string; tracks: Track[] }[] = [
  {
    n: "Month 0",
    name: "Pre-launch",
    tracks: [
      {
        track: "Website",
        body: [
          "Build the 11 pages. Nav and footer finalised.",
          "Full QA — mobile, 404, favicon, meta, OG tags, analytics.",
        ],
        list: { label: "Core pages", items: CORE },
      },
      {
        track: "Projects",
        body: [
          "Lock the 6. One review pass each against the checklist (mobile, load, title/blurb/thumb, links, console, credits). Fix or bump.",
          "Start the month-2 batch (3-ish) in parallel so it isn't cold on day 30.",
        ],
        list: { label: "Project pages", items: PROJECTS },
      },
      {
        track: "Social",
        body: [
          "Handles, bios, profile images.",
          "Build the 12 posts — 6 hero, 3 process, 2 stills, 1 intro. Written, designed, queued before launch.",
        ],
      },
    ],
  },
  {
    n: "Month 1",
    name: "Launch",
    tracks: [
      {
        track: "Website",
        body: ["Ship. Fix what breaks. Get feed ready for launch."],
      },
      {
        track: "Projects",
        body: [
          "Publish nothing new.",
          "Finish and review the month-2 batch. Start the month-3 batch.",
        ],
      },
      {
        track: "Social",
        body: ["Daily until 9–12 posts are up, then 3x/week."],
      },
    ],
  },
  {
    n: "Month 2",
    name: "Feed",
    tracks: [
      {
        track: "Website",
        body: ["Feed ships. Index grows to 9-ish."],
      },
      {
        track: "Projects",
        body: [
          "Publish the batch reviewed in month 1.",
          "Review the month-3 batch. Start the month-4 batch.",
        ],
      },
      {
        track: "Social",
        body: ["3x/week both platforms."],
      },
    ],
  },
  {
    n: "Month 3",
    name: "Analytics and iteration",
    tracks: [
      {
        track: "Website",
        body: [
          "No new features. Read the data now that there's enough of it.",
          "Iterate on what that shows rather than on instinct.",
        ],
      },
      {
        track: "Projects",
        body: [
          "Publish the batch reviewed in month 2.",
          "Review the month-4 batch. Start the month-5 batch.",
        ],
      },
      {
        track: "Social",
        body: ["3x/week both platforms."],
      },
    ],
  },
];

/** The three readings month 3 is spent on, pulled out of the prose so the room
 *  can see what "read the data" actually means. */
const READINGS = [
  { what: "Site analytics", detail: "traffic, entry pages, drop-off" },
  { what: "Per-project stats", detail: "which projects hold attention, which get skipped" },
  { what: "Social progress", detail: "what drives clicks through to the site" },
];

function TrackCard({ track, body, list }: Track) {
  return (
    <div className="flex h-full flex-col border border-ink/15 p-[clamp(18px,2.2vw,26px)]">
      <span className={head}>{track}</span>
      <div className="mt-4 space-y-3">
        {body.map((line) => (
          <p key={line} className="text-[13.5px] leading-[1.8] text-ink-70">
            {line}
          </p>
        ))}
      </div>
      {list && (
        <div className="mt-6 border-t border-ink/15 pt-5">
          <div className="flex items-baseline justify-between">
            <span className={head}>{list.label}</span>
            <span className="font-mono text-[11px] text-ink/40">{list.items.length}</span>
          </div>
          <ol className="mt-3 divide-y divide-ink/10">
            {list.items.map((item, i) => (
              <li key={item} className="flex items-baseline gap-4 py-2.5">
                <span className="font-mono text-[11px] tabular-nums text-ink/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className={`text-[15px] font-extrabold tracking-[-0.015em] ${
                    item.startsWith("6th") ? "text-ink/40" : "text-ink"
                  }`}
                >
                  {item}
                </span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function PlanPage() {
  return (
    <>
      <section className="py-[clamp(48px,8vw,110px)]">
        <Container>
          <p className="eyebrow mb-6">Internal · staging only</p>
          <h1 className="max-w-[14ch] text-[clamp(36px,5.4vw,80px)] font-extrabold leading-[0.96] tracking-[-0.025em] text-ink">
            The plan
          </h1>
          <p className="mt-6 max-w-[620px] text-[14px] leading-[1.8] text-ink-70">
            Eleven pages at launch, then three months of publishing on a fixed
            cadence. Three tracks run in parallel throughout — the website, the
            projects, the social feed — and each one is a month ahead of what the
            public sees.
          </p>
        </Container>
      </section>

      <section className="scroll-mt-24 border-t border-ink/15 py-[clamp(44px,7vw,96px)]">
        <Container>
          <Reveal>
            <span className={head}>Schedule</span>
            <h2 className="mt-3 text-[clamp(26px,3.4vw,44px)] font-extrabold leading-[1.02] tracking-[-0.022em] text-ink">
              Four months, three tracks
            </h2>
          </Reveal>

          <div className="mt-[clamp(26px,4vw,48px)] space-y-[clamp(28px,4vw,52px)]">
            {MONTHS.map((m) => (
              <Reveal key={m.n}>
                <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-t border-ink/40 pt-5">
                  <span className="year text-[clamp(22px,2.6vw,34px)] text-ink">{m.n}</span>
                  <span className="text-[clamp(18px,2.2vw,28px)] font-extrabold tracking-[-0.02em] text-accent-deep">
                    {m.name}
                  </span>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {m.tracks.map((t) => (
                    <TrackCard key={t.track} {...t} />
                  ))}
                </div>
                {m.n === "Month 3" && (
                  <div className="mt-3 border border-ink/15 p-[clamp(18px,2.2vw,26px)]">
                    <span className={head}>What gets read</span>
                    <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
                      {READINGS.map((r) => (
                        <div key={r.what}>
                          <dt className="text-[15px] font-extrabold tracking-[-0.015em] text-ink">
                            {r.what}
                          </dt>
                          <dd className="mt-1 text-[13px] leading-[1.7] text-ink-70">
                            {r.detail}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
