/**
 * The Atlas's subject vocabulary. One list, used by more than one collection.
 *
 * The feed had this list and the projects had their own: nineteen `field`
 * values across twenty-nine projects, thirteen of them used exactly once. That
 * is a caption, not a taxonomy, and it mixed three axes — what a thing IS
 * ("Reference", "Creative tools", which is what `kind` is for), what it is
 * ABOUT ("AI & risk", "Rural futures") and how it WORKS ("Calibration",
 * "Public engagement"). Filtering on it would have meant a row of chips holding
 * one item each, and someone who filtered Quantum in the feed would have found
 * nothing by that name on /projects.
 *
 * So the subject axis is declared once, here, and both collections point at it.
 * `field` survives on a project card as the caption it always really was
 * ("Waves & optics" reads better under a title than "Quantum" does); it just
 * stopped pretending to be a category.
 *
 * A closed list on purpose. Adding a topic is a decision about what the Atlas
 * covers, so it happens here, not by typing a new string into a data file.
 *
 * NOT yet shared with the glossary: `GlossaryDomain` spells the third one
 * "Compute" rather than "Compute & energy", and 315 entries carry it. Bringing
 * it in is a rename across that file, worth doing, not worth smuggling into an
 * unrelated change.
 */

export const TOPICS = [
  "Quantum",
  "AI",
  "Compute & energy",
  "Safety & policy",
  "Society",
  "Futures",
  "Government",
] as const;

export type Topic = (typeof TOPICS)[number];

/** Listing order for filter rows, so they never depend on the data's order. */
export const TOPIC_ORDER: readonly Topic[] = TOPICS;

/** The topics actually present in a list, in listing order. */
export function topicsOf(items: { topics: readonly Topic[] }[]): Topic[] {
  const present = new Set(items.flatMap((i) => i.topics));
  return TOPIC_ORDER.filter((t) => present.has(t));
}
