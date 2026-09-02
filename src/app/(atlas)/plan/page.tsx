import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/Container";
import { Reveal } from "@/components/Reveal";
import { liveProjects, month1Candidates, type Project } from "@/data/projects";

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
 *
 * The project lists are read from src/data/projects.ts rather than typed here,
 * so a card's thumbnail and title are the ones the site actually shows. The
 * month-1 list is every draft carrying `stage: "month-1"`.
 */

const head = "font-mono text-[11px] uppercase tracking-[0.18em] text-accent-deep";

const CORE = ["Home", "About", "Contact", "Developer", "Projects (index)"];

type Item = { title: string; image?: string; path?: string; pending?: boolean };

function itemOf(p: Project): Item {
  return { title: p.title, image: p.image, path: p.path };
}

/** What launches: every live project, in the order the public shelf reads. */
const LAUNCH: Item[] = liveProjects.map(itemOf);

const MONTH_1: Item[] = month1Candidates.map(itemOf);

/** Month 0's to-do list, everything that has to be true before the site ships. */
const MONTH_0_TODO = [
  "Get the 7 live projects ready for launch, plus a few ready to launch in month 1.",
  "Review the website copy.",
  "Review the project copy.",
  "Buy the domain.",
  "Set up the social media account.",
  "Around 12 posts ready to go in the drafts.",
  "Secure the next round of project budget.",
];

type Track = {
  track: string;
  body: string[];
  /** An inventory that belongs to this track, listed inside its card. */
  list?: { label: string; items: Item[] };
  /** A preview that belongs to this track, shown inside its card. */
  preview?: { src: string; href: string; label: string; alt: string };
};

const MONTHS: { n: string; name: string; tracks: Track[] }[] = [
  {
    n: "Month 0",
    name: "Pre-launch",
    tracks: [
      {
        track: "Website",
        body: ["Full QA — mobile, 404, favicon, meta, OG tags, analytics."],
        list: { label: "Core pages", items: CORE.map((title) => ({ title })) },
      },
      {
        track: "Projects",
        body: [
          "Get the 7 live projects ready for launch. One review pass each against the checklist (mobile, load, title/blurb/thumb, links, console, credits). Fix or bump.",
          "Get a few more ready to launch in month 1, so the site has something new on day 30.",
        ],
        list: { label: "Launch projects", items: LAUNCH },
      },
      {
        track: "Social",
        body: [
          "Handles, bios, profile images.",
          "Build the 12 posts. Written, designed, queued before launch.",
        ],
        preview: {
          src: "/plan/instagram-preview.jpg",
          href: "/mocks/instagram",
          label: "Instagram preview",
          alt: "The Instagram preview mock: the @futuresatlas profile and the first rows of the post grid",
        },
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
        list: { label: "Ready to launch", items: LAUNCH },
      },
      {
        track: "Projects",
        body: [
          "Launch a few of the month-1 candidates.",
          "Finish and review the month-2 batch. Start the month-3 batch.",
        ],
        list: { label: "Month 1 candidates", items: MONTH_1 },
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
        body: ["Feed ships."],
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
        body: ["Review the analytics and consider how to increase engagement."],
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
 *  can see what "review the analytics" actually means. */
const READINGS = [
  { what: "Site analytics", detail: "traffic, entry pages, drop-off" },
  { what: "Per-project stats", detail: "which projects hold attention, which get skipped" },
  { what: "Social progress", detail: "what drives clicks through to the site" },
];

function Thumb({ item }: { item: Item }) {
  return (
    <span
      className={`relative block aspect-[3/2] w-[72px] shrink-0 overflow-hidden border border-ink/10 ${
        item.image ? "" : "fa-hatch"
      }`}
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      )}
    </span>
  );
}

function ItemRow({ item, i, thumbs }: { item: Item; i: number; thumbs: boolean }) {
  const title = (
    <span
      className={`text-[15px] font-extrabold tracking-[-0.015em] ${
        item.pending ? "text-ink/40" : "text-ink"
      }`}
    >
      {item.title}
    </span>
  );
  return (
    <li className="flex items-center gap-4 py-2.5">
      <span className="font-mono text-[11px] tabular-nums text-ink/40">
        {String(i + 1).padStart(2, "0")}
      </span>
      {thumbs && <Thumb item={item} />}
      {item.path ? (
        <Link
          href={item.path}
          prefetch={false}
          className="underline-offset-4 transition-colors hover:text-accent-deep hover:underline"
        >
          {title}
        </Link>
      ) : (
        title
      )}
    </li>
  );
}

function TrackCard({ track, body, list, preview }: Track) {
  const thumbs = Boolean(list?.items.some((x) => x.image || x.pending));
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
              <ItemRow key={item.title} item={item} i={i} thumbs={thumbs} />
            ))}
          </ol>
        </div>
      )}
      {preview && (
        <div className="mt-6 border-t border-ink/15 pt-5">
          <Link
            href={preview.href}
            prefetch={false}
            className="group block"
          >
            <span className="relative block aspect-[4/3] w-full overflow-hidden border border-ink/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview.src}
                alt={preview.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </span>
            <span className="mt-3 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink underline-offset-4 transition-colors group-hover:text-accent-deep group-hover:underline">
              {preview.label} <span aria-hidden="true">→</span>
            </span>
          </Link>
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
                {m.n === "Month 0" && (
                  <div className="mt-3 border border-ink/15 p-[clamp(18px,2.2vw,26px)]">
                    <div className="flex items-baseline justify-between">
                      <span className={head}>To do</span>
                      <span className="font-mono text-[11px] text-ink/40">{MONTH_0_TODO.length}</span>
                    </div>
                    <ol className="mt-3 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                      {MONTH_0_TODO.map((item, i) => (
                        <li
                          key={item}
                          className="flex items-baseline gap-4 border-t border-ink/10 py-2.5"
                        >
                          <span className="font-mono text-[11px] tabular-nums text-ink/40">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[14px] leading-[1.6] text-ink">{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
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
