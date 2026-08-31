/**
 * The dataset contract — the whole point of the project.
 *
 * Mapping Police Violence is one instance of a general shape: a set of dated,
 * located, categorised records; a headline SENTENCE with the computed number in
 * it; a map where one dot is one record; a trend; a few breakdowns; a
 * filterable table; and a methodology block that says exactly where the numbers
 * came from. `Mapping` captures that shape so the data domain is a variable:
 * to add a new mapping you write a module that fulfils this contract and
 * register it in `data/index.ts` — no widget changes.
 *
 * Honesty rules (Atlas-wide, enforced here by convention):
 * - Every record carries enough to trace it back (`url` on the record or a
 *   dataset-level source). Nothing is invented to fill a widget.
 * - Records without coordinates still count in every figure; the map states
 *   "n of m records located" rather than pretending completeness.
 * - `source.license` is rendered on screen. Only openly licensed data ships.
 * - Headlines say "at least": these are disclosed records, not the world.
 */

/** One row of evidence. The unit of everything downstream. */
export type Rec = {
  id: string;
  name: string; // e.g. "xAI Colossus Memphis Phase 3", "OpenAI — SoftBank round"
  /** ISO-ish date: YYYY, YYYY-MM or YYYY-MM-DD. Ordering + timeline binning. */
  date: string;
  lat?: number;
  lng?: number;
  place?: string; // human-readable location ("Memphis, TN, US")
  /**
   * The coordinates are a country-level placeholder (the source disclosed no
   * site). The map must never draw these as individual located dots — they
   * aggregate into one clearly-marked country marker instead.
   */
  approx?: boolean;
  /** Primary measure in the mapping's unit (H100-equivalents, USD…). */
  value: number | null; // null = genuinely unreported; charts must not guess
  /** Dimension key -> value; drives filters and breakdowns. */
  dims: Record<string, string>;
  url?: string; // per-record source link
  note?: string; // short extra fact shown in tooltip/table (e.g. "352 MW")
};

/** A dimension of the records. Filterable ones become chip rows. */
export type Dim = {
  key: string;
  label: string;
  filterable: boolean;
};

export type SourceInfo = {
  name: string; // "Epoch AI — AI Supercomputers"
  url: string; // the human landing page for the dataset
  dataUrl?: string; // the direct file, when one exists
  license: string; // "CC BY 4.0" — rendered on screen, always
  licenseUrl?: string;
  retrieved: string; // YYYY-MM-DD the snapshot was taken
  /** How the snapshot was made + what was kept/dropped. Plain sentences. */
  method: string[];
};

export type Headline = {
  /** The big numeral (already formatted). */
  big: string;
  /**
   * The sentence around it, with `___` marking where the numeral sits.
   * MPV's strongest widget is a sentence, not a chart — filters recompute it.
   */
  sentence: string;
  /** Small mono sub-line: hedges, denominators, what is NOT counted. */
  sub: string;
};

export type Breakdown = {
  key: string; // a dim key
  label: string; // panel label, e.g. "By country"
  top?: number; // keep the top N groups (default 8), rest -> "Other"
  span?: 1 | 2; // card width on the 3-column board (default 1)
};

export type Mapping = {
  slug: string; // hash route: #/<slug>
  title: string; // "Mapping the Compute Buildout"
  /** What one record IS in this mapping — "AI supercomputer", "funding round". */
  recordNoun: string;
  intro: string;
  /** Formats the primary measure, e.g. 2400000 -> "2.4M H100e" / "$2.4B". */
  format: (v: number) => string;
  /** Recomputed from the FILTERED records — the sentence stays honest. */
  headline: (recs: Rec[]) => Headline;
  dims: Dim[];
  records: Rec[];
  sources: SourceInfo[];
  map: {
    /** Caption under the map naming what a dot is and how it is sized. */
    dotLegend: string;
  };
  timeline: {
    label: string; // panel label, e.g. "H100-equivalents added per year"
    metric: "value" | "count";
    /** The trailing period is incomplete — its bar renders hatched. */
    openEndedYear?: number;
  };
  /** Month-grid calendar heatmap (records per month, MPV's time-texture). */
  calendar: {
    label: string; // "Systems coming online, month by month"
  };
  /** Cumulative disclosed-value curve over time. */
  cumulative: {
    label: string; // "Total mapped computing power over time"
  };
  /**
   * Concentration ring: what share of the summed disclosed measure sits with
   * the top N groups of one dimension. One arc against an empty track — the
   * remainder is drawn as track, not as a second measured share.
   */
  concentration: {
    dim: string; // a dim key
    top: number;
    label: string; // "…of mapped computing power sits with the top 5 owners"
  };
  breakdowns: Breakdown[];
  /** Extra methodology paragraphs beyond the per-source notes. */
  methodNotes: string[];
};

/** Global filter state — one state, every widget obeys it (the MPV pattern). */
export type Filters = {
  /**
   * dim key -> selected values (empty set = no filter on that dim).
   * The pseudo-key "__year" filters on the record's year.
   */
  dims: Map<string, Set<string>>;
};

export const YEAR_KEY = "__year";

export const year = (r: Rec): number => Number(r.date.slice(0, 4));

export function applyFilters(recs: Rec[], f: Filters): Rec[] {
  return recs.filter((r) => {
    for (const [k, sel] of f.dims) {
      if (!sel.size) continue;
      const v = k === YEAR_KEY ? String(year(r)) : (r.dims[k] ?? "");
      if (!sel.has(v)) return false;
    }
    return true;
  });
}
