/**
 * The Chronicle: the extended, sectioned timeline of how extinction risk from
 * AI became a public question. Every entry has a date, a one-paragraph
 * account, and the links that account rests on; nothing is in here from
 * memory alone, and every link is checked by scripts/doom-score/check-links.mjs.
 * Ledger quotes are embedded by id, never copied, so the ledger stays the one
 * place a quote lives.
 */
export type ChronicleKind = "event" | "statement" | "number" | "paper" | "policy" | "media" | "market" | "book" | "survey" | "incident" | "context";

export const CHRONICLE_KIND_LABEL: Record<ChronicleKind, string> = {
  event: "Event",
  statement: "Statement",
  number: "A number",
  paper: "Paper",
  policy: "Policy",
  media: "In the press",
  market: "Markets",
  book: "Book",
  survey: "Survey",
  incident: "Incident",
  context: "Context",
};

export interface ChronicleLink {
  title: string;
  url: string;
  outlet: string;
  /** ISO date of the piece when known. */
  date?: string;
  /** A recording: the link plays rather than reads. */
  media?: "video" | "audio";
}

export interface ChronicleEntry {
  id: string;
  /** ISO; YYYY-MM when the sources give only a month. */
  date: string;
  title: string;
  kind: ChronicleKind;
  /** 3 = a turning point, 2 = notable, 1 = a beat. Drives the card size. */
  weight: 1 | 2 | 3;
  /** One paragraph, factual, in the sources' terms. */
  summary: string;
  /** Further facts, one per line, each resting on the links. */
  detail?: string[];
  links: ChronicleLink[];
  /** Ledger row ids whose quotes belong with this entry. */
  ledger?: string[];
  /** People named, for portraits. */
  people?: string[];
  /** Other entries this one leads to or from, by id; drawn as links under the entry. */
  related?: string[];
}

export interface ChronicleSection {
  id: string;
  title: string;
  /** Shown under the title: the span in words. */
  span: string;
  from: string; // ISO month
  to: string; // ISO month, inclusive
  intro: string;
  entries: ChronicleEntry[];
}
