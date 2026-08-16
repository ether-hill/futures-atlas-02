/**
 * The bench — what is on it right now, and what came off it.
 *
 * The feed's other cards are finished things pointing outward: a post, a
 * report, somebody else's video. This is the opposite view. It shows the
 * inside of work in progress — a decision that got made, a decision that got
 * reversed, a rule we had to write down, a question still open.
 *
 * ── The rules ───────────────────────────────────────────────────────────────
 *
 * 1. **Every specimen is real and locatable.** `at` names the file, the doc or
 *    the day it comes from. Nothing here is written for the card. If it cannot
 *    be pointed at in the repo or in a published page, it does not go on the
 *    bench.
 * 2. **`rejected` is not a humblebrag.** These are things that were built or
 *    proposed and then taken out, with the actual reason. The Atlas already
 *    publishes its reports' rejects; this is the same habit applied to the
 *    making. A bench with no failures on it is a shop window.
 * 3. **`open` means open.** Not a teaser for something already finished. If it
 *    gets resolved, the specimen moves to `note` or comes off.
 *
 * Nothing here is a roadmap and nothing is a promise. It is a workbench.
 */

/** What kind of thing a specimen is. Drives the tag and the treatment. */
export type SpecimenKind = "source" | "rejected" | "open" | "note";

export const SPECIMEN_LABEL: Record<SpecimenKind, string> = {
  source: "From the source",
  rejected: "Taken out",
  open: "Still open",
  note: "Noted",
};

export interface Specimen {
  kind: SpecimenKind;
  /** The fragment. Short — a card is not a document. */
  body: string;
  /** Where it can be found: a path, a file, a date. Always specific. */
  at: string;
  /** `true` renders it as code. Only for things that ARE code. */
  mono?: boolean;
}

export interface BenchProject {
  id: string;
  title: string;
  /** What it is, in four or five words. Not a tagline. */
  field: string;
  /** Where it lives, if a reader can open it. Omitted while it is not public. */
  href?: string;
  /** Shown when there is no href — the honest version of "coming soon". */
  state?: string;
  specimens: Specimen[];
}

export const BENCH: BenchProject[] = [
  {
    id: "magnifica",
    title: "Hypothetica Magnifica",
    field: "Speculative encyclicals",
    href: "/magnifica",
    specimens: [
      {
        kind: "rejected",
        body: "Generated portraits of the sixteen faith leaders. The project's own content documents leaders objecting to deepfakes of themselves — so every portrait is a real Wikimedia photograph under a free licence, cropped to one 4:5 frame. The house look comes from a CSS greyscale treatment, not from generation.",
        at: "magnifica/ASSETS.md",
      },
      {
        kind: "source",
        body: "Removing the caption is a licence breach, not a design tidy-up.",
        at: "magnifica/src/portraits.ts",
        mono: true,
      },
      {
        kind: "note",
        body: "The hero image IS generated — a variation on Michelangelo's public-domain Creation of Adam, no living person involved. The right hand has seven fingers on purpose. The alt text says so.",
        at: "magnifica/src/app.ts",
      },
      {
        kind: "rejected",
        body: "Easing the parallax plates toward their target. It looked smooth in isolation and felt broken in the hand: the image visibly lagged the page and kept drifting after you stopped. Position is not the place for smoothing.",
        at: "magnifica/src/parallax.ts",
      },
      {
        kind: "open",
        body: "The hero video still carries its colour grade as a runtime CSS filter instead of baked into the file, because the grading pass has not been run. One filter, one video — but it is a filter on a moving layer, which is the thing we spent a day removing everywhere else.",
        at: "magnifica/src/experience.css",
      },
    ],
  },
  {
    id: "reports",
    title: "The reports",
    field: "Evidence with its scope attached",
    href: "/feed/ai-hegemony",
    specimens: [
      {
        kind: "source",
        body: "If you cannot write the scope line, you do not yet have the finding.",
        at: "src/data/report-types.ts",
        mono: true,
      },
      {
        kind: "rejected",
        body: "“51% of AI training data is American.” The most-quoted number in the field, and nobody has evidenced it. What was measured is narrower: 51.3% of pages in a 2019 Common Crawl snapshot were HOSTED in the United States. Hosting is not authorship.",
        at: "/feed/ai-hegemony — Checked, and not used",
      },
      {
        kind: "source",
        body: "A chart is a re-presentation of `figure`, never an addition to it.",
        at: "src/data/report-types.ts",
        mono: true,
      },
      {
        kind: "open",
        body: "The kill-chain report's broadcast record is five clips and four are the same week in April 2024. That is not a harvesting gap — there is no television record of Maven, of Replicator, or of the UN votes. Still deciding whether to widen the section to hearings and conference talks, or to leave the hole visible.",
        at: "/feed/ai-kill-chain",
      },
      {
        kind: "note",
        body: "Eight findings across the three reports carry no chart at all, because the absence of a number IS the finding. Drawing something there would be the exact move the reports criticise.",
        at: "src/components/report/FindingCard.tsx",
      },
    ],
  },
  {
    id: "trajectories",
    title: "Trajectories",
    field: "Homage, credited",
    href: "/trajectories",
    specimens: [
      {
        kind: "source",
        body: "Control names/ranges mirror Jeongho Park's \"Collective Trajectories\" GUI (CC BY-NC 4.0). Implementation is original.",
        at: "trajectories/src/config.ts",
        mono: true,
      },
      {
        kind: "note",
        body: "The attribution is rendered on the page itself, not buried in a comment. A homage that hides its source is just a copy with better manners.",
        at: "trajectories/src/app.ts",
      },
    ],
  },
  {
    id: "twins",
    title: "Hyperscale · Gigawatt",
    field: "The same brief, twice",
    href: "/hyperscale",
    specimens: [
      {
        kind: "note",
        body: "Two builds of one brief — a data-centre simulation — kept side by side on purpose rather than merged. One supersedes nothing. The comparison is the artefact.",
        at: "CLAUDE.md",
      },
      {
        kind: "open",
        body: "Neither twin has a way to show you what differs between them without opening both in two tabs. A diff view is the obvious answer and nobody has built it.",
        at: "the bench",
      },
    ],
  },
  {
    id: "face-control",
    title: "Head-tracked camera",
    field: "Webcam as a controller",
    state: "Not started — waiting on which world it plugs into",
    specimens: [
      {
        kind: "open",
        body: "Move your head, move the camera. The tracking layer is the same wherever it lands; what is not decided is whether it drives a 3D world or the parallax plates on a reading page, which are very different feels.",
        at: "the bench, 16 Aug 2026",
      },
      {
        kind: "note",
        body: "Whatever it drives: off by default, off after reload, camera requested only on first activation, stream fully stopped when switched off — and a visible indicator the whole time it is live. No frame leaves the machine.",
        at: "the bench, 16 Aug 2026",
      },
    ],
  },
];
