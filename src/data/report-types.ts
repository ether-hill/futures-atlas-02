/**
 * The evidence contract, shared by every Atlas report.
 *
 * Lifted out of `hegemony.ts` when the second and third reports were written,
 * so the rules below are enforced in one place rather than re-typed — and
 * re-interpreted — per report.
 *
 * ── The rule these types exist to enforce ───────────────────────────────────
 *
 * A report whose thesis is "cite everything" fails the moment one claim is
 * stated wider than its evidence. So every Finding carries BOTH a `figure` and
 * a `scope`, and the page renders them together, always. "51% of AI training
 * data is American" is not a claim anyone has evidenced; "51.3% of pages in
 * Google's C4 — a 2019 Common Crawl snapshot behind T5 and LLaMA — were hosted
 * in the United States" is. The second is what goes in a report.
 *
 * `scope` is therefore NOT optional and must never be an empty string. It names
 * the dataset, the model, the year, the sample — whatever bounds the claim. If
 * you cannot write the scope line, you do not yet have the finding.
 *
 * No number in a report data file may be estimated, rounded for effect, or
 * carried over from memory. Every entry has a `url` that was fetched and
 * checked.
 */

/** How much weight a claim carries, and why. Drives the badge colour. */
export type Tier = "documented" | "reported" | "emergent";

export const TIER_LABEL: Record<Tier, string> = {
  documented: "Documented",
  reported: "Reported",
  emergent: "Emergent research",
};

/** Spelled out on the page, in the methodology section — not left to a colour. */
export const TIER_MEANING: Record<Tier, string> = {
  documented:
    "Peer-reviewed research or a primary source, with a published methodology you can check.",
  reported:
    "Credible journalism, where the underlying data is held by the publisher rather than released.",
  emergent:
    "Recent or preliminary work — a preprint, an early finding. Likely to be revised, and cited here as a signal rather than a settled fact.",
};

export interface Source {
  /** Publication or venue — "Washington Post", "ACL", "Nature". */
  name: string;
  /** Author(s) or the responsible organisation. */
  author: string;
  /** The source's own date. May be `YYYY` or `YYYY-MM` for older work. */
  published: string;
  /** Canonical URL. Fetched and checked — never assembled from memory. */
  url: string;
}

/**
 * One quantity on a finding's chart.
 *
 * Everything written on screen is assembled from these fields, so the label
 * under a bar cannot drift from the bar's length. The number counts up, which
 * is why `prefix` exists separately: "up to" and "more than" are the SOURCE's
 * hedges, they belong to the claim rather than to the arithmetic, and they
 * must not animate as if they were part of the figure.
 */
export interface Measure {
  /** What is being counted. */
  label: string;
  /** The number itself, exactly as the finding states it. Never rounded. */
  value: number;
  /** Written straight after the number: "%", "×", or "" for a bare count. */
  unit: string;
  /**
   * A qualifier the source itself uses — "up to ", "more than ". Only ever
   * copied from the finding; if the source did not hedge, neither do we.
   */
  prefix?: string;
  /** A definitional reference point (1×, a baseline) rather than a measurement. */
  baseline?: boolean;
}

/**
 * Which mark a finding's numbers get.
 *
 * Chosen per finding by what the data IS, never for variety's sake — a share
 * of a whole is a ring, three orders of magnitude is a dot plot on a log axis
 * because a linear bar renders 0.03% as nothing, a before-and-after is a
 * slope, an exact count out of an exact denominator is a waffle whose cells
 * you can literally count, and a multiplier is a length against a 1× rule.
 * Bars are the default, for categories that are simply being compared.
 *
 * `count` is the mark for a number with no denominator — 37,000 people marked,
 * 20 seconds of review. Those have no whole to be a share OF, and drawing them
 * as a ring produces a full circle every time, which reads as "all of it" and
 * means nothing. The number counts up and stands on its own.
 */
export type ChartKind = "bars" | "ring" | "waffle" | "slope" | "multiple" | "dots" | "count";

/**
 * The optional chart on a finding's card.
 *
 * ── The rule, which is the same rule as `scope` ─────────────────────────────
 *
 * A chart is a re-presentation of `figure`, never an addition to it. Every
 * `value` must already be stated in that finding's own `claim` or `detail`.
 * Nothing may be inferred, completed to a round number, or filled in to make a
 * bar look better — including the remainder of a percentage, which is why a
 * share is drawn as one bar against an empty track rather than as two bars
 * that happen to sum to 100.
 *
 * A finding with no chart is not an omission. Where the absence of a number IS
 * the finding, drawing something would be the exact move a report like this
 * criticises.
 */
export interface FindingChart {
  kind: ChartKind;
  /** What the marks are drawn against. 100 for a percentage, the total for a count. */
  max: number;
  bars: Measure[];
  /** One line naming precisely what is measured. Not a restatement of the claim. */
  axis: string;
  /**
   * `waffle` only: how many cells the grid has — the denominator, drawn. Used
   * only where the finding states an exact "n of N", so every cell is real.
   */
  cells?: number;
}

/**
 * `strand` is a plain string here and a closed union in each report's own data
 * file: the sections differ per report, but the shape of a finding does not.
 */
export interface Finding {
  id: string;
  strand: string;
  /** One sentence, scoped precisely. This is the card's headline. */
  claim: string;
  /** Two or three sentences of substance behind the claim. */
  detail: string;
  /** The headline number, if there is one. Null when the finding is qualitative. */
  figure: string | null;
  /** What this finding does and does not cover. Rendered always. Never empty. */
  scope: string;
  tier: Tier;
  source: Source;
  /** Drawn only where the finding's own numbers support a mark. */
  chart?: FindingChart;
}

export interface TimelineEvent {
  id: string;
  /** `YYYY-MM-DD` or `YYYY-MM`. */
  date: string;
  /** Which of the three the date refers to — releases get misremembered. */
  dateNote: "announcement" | "preview" | "general availability" | "publication";
  /** A thing shipping, a finding landing, or someone responding to one. */
  strand: "release" | "finding" | "response";
  title: string;
  detail: string;
  tier: Tier;
  source: Source;
}

/**
 * Claims investigated and deliberately left out.
 *
 * This is published, not kept in a drawer. A report that documents other
 * people's sourcing owes the reader its own, and "we checked this and it did
 * not hold up" is a finding in its own right.
 */
export interface Dropped {
  claim: string;
  reason: string;
}

export interface Video {
  /** YouTube id. The canonical URL is built from it, so it cannot disagree. */
  id: string;
  /** The channel's own name, as YouTube returns it. */
  channel: string;
  /** The upload's own title, as YouTube returns it. */
  title: string;
  /** Upload date, `YYYY-MM-DD`, read from the watch page. */
  published: string;
  /** Our one line on why it is here — what it covers, not what it proves. */
  blurb: string;
  /**
   * Full still URL. Recorded rather than assembled: maxresdefault is missing
   * for plenty of uploads and a guessed URL is a broken image.
   */
  thumb: string;
}

export interface PressItem {
  id: string;
  /** Masthead, as the publisher writes it. Also the read-at link label. */
  publisher: string;
  /** The piece's own headline. */
  title: string;
  /** Publication date, `YYYY-MM-DD`. */
  published: string;
  /** Our one line on what the piece reports. */
  blurb: string;
  url: string;
  /**
   * The publisher's own og:image, hot-linked, and confirmed to resolve. `null`
   * where none was checked — the card then renders typographically rather than
   * carrying a guessed URL, which is a broken image and a false claim at once.
   */
  image: string | null;
}

/** Helpers every report's data file uses on its own arrays. */
export const findingsInStrand = <T extends Finding>(all: T[], strand: string) =>
  all.filter((f) => f.strand === strand);

export const countTier = (all: Finding[], t: Tier) => all.filter((f) => f.tier === t).length;
