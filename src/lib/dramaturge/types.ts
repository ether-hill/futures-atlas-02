/**
 * The data contract. Every rule in the brief that can be expressed as a type is
 * expressed here, so a violation is a compile error rather than a review note.
 */

/** What the operator asked for, expanded by the brief agent into search terms. */
export type ThemeSpec = {
  id: string;
  label: string;
  /** Exact-match terms, e.g. aurum, chrysopoeia, tincture. */
  seedTerms: string[];
  /** Meaning-match prompts, e.g. "a metal that does not corrupt". */
  conceptPrompts: string[];
  /** Terms that drag the pool off-theme; a hit here demotes a page. */
  exclude: string[];
  /** The operator's own words, carried through to the spine agent unaltered. */
  instructions: string;
};

export type BookRef = {
  bookId: string;
  slug: string;
  title: string;
  displayTitle: string | null;
  author: string;
  published: string;
  language: string;
  /** The language the work was composed in, when the edition is a translation. */
  workLanguage?: string | null;
  textRole?: string | null;
  pages: number;
  pagesTranslated: number;
  thumbnail: string | null;
  url: string;
};

/** One verified page. Text on it is never edited after this record is written. */
export type Passage = {
  id: string; // b1p173
  bookId: string;
  page: number;
  lang: string;
  /** Page text with apparatus tags and the provenance watermark removed. */
  verbatim: string;
  /** "translation" -> attribute to the translator. "ocr_original" -> the source's own words. */
  textSource: "translation" | "ocr_original";
  translationNote?: string;
  /** Marginal notes, held apart. Copy-specific apparatus, never spoken. */
  marginalia: string[];
  /** The scan carries a reading the transcription marks as unclear. */
  uncertain: boolean;
  citationLink: string;
  readerUrl: string;
  citationFootnote: string;
  pageImageUrl?: string;
  score: number;
  matchedBy: ("term" | "concept")[];
  /** Every quotable sentence on this page, already split and id'd. */
  lines: SourceLine[];
};

/**
 * One quotable sentence. This — not the page — is the unit a play quotes, and
 * the id is what an agent cites. Agents never retype the text: the renderer
 * substitutes it from the pool, so a quotation cannot drift by construction.
 */
export type SourceLine = {
  id: string; // b1p173l4
  passageId: string;
  bookId: string;
  page: number;
  /** Exactly as harvested. The validator byte-compares against this. */
  text: string;
  /** True when the sentence was completed across a page break. */
  spansPages: boolean;
  /** Pages the sentence actually occupies, in order. */
  pages: number[];
  citationLink: string;
  words: number;
  /** The leaf carries an uncertain reading; the appendix says so. */
  uncertain: boolean;
};

export type Pool = {
  themeId: string;
  theme: ThemeSpec;
  createdAt: string;
  books: BookRef[];
  passages: Passage[];
  lines: SourceLine[];
  stats: {
    perBook: Record<string, number>;
    pagesRead: number;
    cacheHits: number;
    /** Search hits that offered no page text — an AI summary, not the book. */
    droppedSummaries: number;
    continuityResolved: number;
  };
};

export type Beat = {
  id: string;
  summary: string;
  /** SourceLine ids. At least one, always. */
  citations: string[];
};

export type Spine = {
  title: string;
  logline: string;
  dramatisPersonae: {
    name: string;
    origin: "source" | "invented";
    note: string;
  }[];
  acts: { title: string; beats: Beat[] }[];
};

export type Play = {
  id: string;
  spine: Spine;
  fountain: string;
  /** Line ids actually quoted, in order of appearance. */
  quoted: string[];
};

export type RunStatus =
  | "queued"
  | "briefing"
  | "harvesting"
  | "verifying"
  | "composing"
  | "writing"
  | "done"
  | "failed"
  | "blocked";

export type RunEvent = {
  at: string;
  stage: string;
  /** "start" | "ok" | "warn" | "fail" — drives the dot colour in the UI. */
  kind: "start" | "ok" | "warn" | "fail";
  message: string;
  detail?: string;
};

export type Run = {
  id: string;
  createdAt: string;
  status: RunStatus;
  instructions: string;
  bookIds: string[];
  playCount: number;
  theme?: ThemeSpec;
  poolSummary?: {
    passages: number;
    lines: number;
    perBook: Record<string, number>;
    pagesRead: number;
  };
  plays: { id: string; title: string; logline: string }[];
  error?: string;
};

/**
 * What ships with a published set of plays: the plays themselves plus exactly
 * the evidence they cite, and nothing else from the pool they were drawn from.
 *
 * A pool is mostly weight a reader never sees — the full text of every leaf
 * considered and every sentence not used. Trimming to the cited lines is what
 * makes a set of plays committable as a data module rather than a blob, and
 * the bundle is still the comparison baseline the verbatim validator runs
 * against.
 */
export type Bundle = {
  theme: ThemeSpec;
  createdAt: string;
  books: BookRef[];
  /** Only the leaves a play quotes from; the page's full text is dropped. */
  passages: Array<Omit<Passage, "lines" | "verbatim">>;
  /** Only the lines a play quotes. */
  lines: SourceLine[];
  plays: Play[];
  /** What the full pool held, so the reader can say what was drawn from. */
  provenance: {
    pooledPassages: number;
    pooledLines: number;
    pagesRead: number;
    perBook: Record<string, number>;
  };
};
