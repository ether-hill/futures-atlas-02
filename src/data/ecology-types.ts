/**
 * The industry-layer contract, shared by every Atlas report that carries an
 * ecology module.
 *
 * ── Two rules, both inherited from report-types ─────────────────────────────
 *
 * 1. **A nebula is not a market map.** Nothing here ranks organisations by
 *    valuation, headcount, funding or product quality — a report that has
 *    measured none of those has no business quoting them, and doing so is
 *    exactly the borrowed-number failure the evidence contract exists to
 *    correct. Weight is `countMentions`: how often the name appears in that
 *    report's own findings and timeline. It is a picture of the record, and
 *    the module says so on screen.
 *
 * 2. **Leadership is a dated snapshot.** Who runs an organisation changes,
 *    sometimes in the week you publish. So every Leader carries `asOf` and its
 *    own fetched-and-checked source, and the card renders both. A leadership
 *    claim with no date on it goes stale silently, which is the one failure
 *    mode this contract cannot have.
 */

import type { Finding, Source, TimelineEvent } from "./report-types";

/** What an organisation is DOING in a record — not what it sells. */
export type OrgRole = "lab" | "dataset" | "measurer" | "labour" | "state" | "capital";

export const ORG_ROLE_LABEL: Record<OrgRole, string> = {
  lab: "Builds the systems",
  dataset: "Supplies the material",
  measurer: "Measures it",
  labour: "Does the hidden work",
  state: "Governs or buys",
  capital: "Funds it",
};

export interface Org {
  id: string;
  name: string;
  role: OrgRole;
  /** Key in `lib/logos`. Omitted where no free mark exists — a monogram shows. */
  logo?: string;
  /**
   * Every spelling to count, including the first. Kept deliberately literal:
   * a product name is not counted as its parent, because inferring the parent
   * is a judgement, and this tally is supposed to be a fact about the text
   * rather than a fact about our reading of it.
   */
  aliases: string[];
  /** What the report documents about them. Never a company description. */
  note: string;
}

export interface Leader {
  id: string;
  name: string;
  /** Their title, as the source gives it. */
  role: string;
  /** Org id, so the card can carry the mark and the two cannot disagree. */
  org: string;
  /**
   * What the record says. Facts with dates, not characterisation — a report
   * has no business summing up a person, and a profile written from vibes is
   * the same failure as a number written from memory.
   */
  note: string;
  /** The day this was checked. Rendered, because leadership moves. */
  asOf: string;
  source: Source;
}

/**
 * How many times an organisation is named in a report's own text.
 *
 * Counted across every field a reader actually reads — claim, detail, scope,
 * and the source's name and author — plus the timeline. Word-bounded, so
 * "Meta" does not match "metadata". This is a fact about the page, computed
 * from the page, and it moves the moment a finding is added.
 */
export function countMentions(org: Org, findings: Finding[], timeline: TimelineEvent[]): number {
  const hay = [
    ...findings.flatMap((f) => [f.claim, f.detail, f.scope, f.source.name, f.source.author]),
    ...timeline.flatMap((e) => [e.title, e.detail, e.source.name, e.source.author]),
  ].join("   ");

  return org.aliases.reduce((n, alias) => {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return n + (hay.match(new RegExp(`\\b${escaped}\\b`, "g"))?.length ?? 0);
  }, 0);
}
