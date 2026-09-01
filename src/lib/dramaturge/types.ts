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

/* ── the storyboard ─────────────────────────────────────────────────────── */

/**
 * One thing that can appear on screen. Either a leaf this project verified and
 * quoted, or an image the operator pasted a URL to. Both carry a credit, and
 * neither is ever a URL this code invented — a constructed image address that
 * 404s is a broken picture and a false claim at once.
 */
export type Asset =
  | {
      kind: "leaf";
      /** The line whose page this is, so the caption and the picture agree. */
      passageId: string;
      bookId: string;
      page: number;
      src: string;
      credit: string;
    }
  | {
      kind: "url";
      src: string;
      /** Whatever the operator can tell us about where it came from. */
      credit: string;
      note?: string;
    };

/** How the camera moves across a still. Stills are all we have, so this is the film. */
export type Motion = "hold" | "push-in" | "pull-out" | "pan-left" | "pan-right" | "tilt-down";

/**
 * A caption is a verbatim quotation or it is nothing. `lineId` points into the
 * collection and the renderer substitutes the wording from there, so what is
 * burned into a frame cannot drift from what the book says.
 */
export type Caption = {
  lineId: string;
  /** Copied from the line at build time; the validator byte-compares it back. */
  text: string;
  citationLink: string;
  attribution: string;
};

export type Shot = {
  id: string;
  asset: Asset;
  caption: Caption | null;
  /** Invented framing text — a title card or an intertitle. Never in quotes. */
  titleCard?: string;
  motion: Motion;
  durationMs: number;
  /** Why this shot is here, in plain prose. Editorial, shown in the editor. */
  note?: string;
};

export type Storyboard = {
  id: string;
  title: string;
  logline: string;
  aspect: "16:9" | "9:16" | "1:1";
  fps: number;
  shots: Shot[];
  /** Set when a human has edited it, so a rebuild does not silently discard the edit. */
  editedAt?: string;
};

/** What a render produced, recorded next to the storyboard that made it. */
export type Clip = {
  storyboardId: string;
  file: string;
  width: number;
  height: number;
  fps: number;
  durationMs: number;
  renderedAt: string;
  /** Every line quoted on screen, so the clip carries its own citations. */
  cited: string[];
};

/**
 * What the operator assembled before any storyboard exists: the books, the
 * verified passages and lines drawn from them, and any assets pasted by URL.
 */
export type Collection = {
  id: string;
  theme: ThemeSpec;
  createdAt: string;
  books: BookRef[];
  passages: Passage[];
  lines: SourceLine[];
  extraAssets: Asset[];
  stats: {
    perBook: Record<string, number>;
    pagesRead: number;
    cacheHits: number;
    droppedSummaries: number;
    continuityResolved: number;
  };
};
