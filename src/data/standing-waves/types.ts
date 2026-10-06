/**
 * Standing Waves — the evidence contract.
 *
 * Everything the microsite shows is one of these four records, and every one of
 * them points at a Source by id. `src/lib/standing-waves/integrity.ts` refuses
 * the build if any id dangles, if an event has no source, or if a media item
 * is missing its alt text or its licence. The checks are the point: the site's
 * whole argument is "cite everything", so an uncited record must not render.
 */

/** Which line of work a record belongs to. Drives the timeline's four lanes. */
export type Lane = "cymatics" | "wave-physics" | "quantum" | "pilot-wave";

/**
 * How far a claim stands. Not a quality score: `historical` is a result that
 * stood and has since been absorbed into textbooks, `established` one that is
 * current and accepted, `contested` one that is published and disputed in
 * print, `not-replicated` one that a later, careful attempt failed to
 * reproduce, `unsupported-claim` one made in public with no peer-reviewed
 * support at all.
 */
export type Status = "established" | "contested" | "not-replicated" | "unsupported-claim" | "historical";

export interface Source {
  id: string; // e.g. "couder-fort-2006"
  citation: string; // full formatted citation
  url: string; // DOI link preferred, else a stable URL
  openAccessUrl?: string;
  /**
   * True only after the link was opened and the metadata checked against it.
   * A false here is published as such on /sources, with `todo` saying what is
   * left to check — never quietly flipped.
   */
  verified: boolean;
  todo?: string;
}

export interface TimelineEvent {
  id: string;
  year: number;
  dateLabel?: string; // "8 July 1680"
  lane: Lane;
  title: string;
  people: string[]; // Person ids
  finding: string; // one plain sentence a 12-year-old can follow
  detail?: string; // 2–4 sentences, technical
  status: Status;
  sourceIds: string[]; // at least 1
  mediaId?: string;
  relatedArticle?: string; // Article slug
  /**
   * The double-slit story: claim → test → result. Events sharing a thread id
   * are drawn as one linked run on the timeline; `threadRole` says which part
   * of the argument each one is.
   */
  thread?: "double-slit";
  threadRole?: "claim" | "test" | "result";
}

export interface Person {
  id: string;
  name: string;
  years: string;
  role: string;
  summary: string; // 80–150 words, factual
  contributions: string[];
  contested?: string; // plain note if their claims are disputed, sourced on both sides
  /** Links OUT to work we cannot show (Kymatik photographs, CymaScope images). */
  elsewhere?: { label: string; url: string }[];
  sourceIds: string[];
  portraitMediaId?: string; // only if rights-cleared
}

export type MediaKind = "generated" | "public-domain" | "cc" | "own" | "permissioned";

export interface MediaItem {
  id: string;
  title: string;
  kind: MediaKind;
  /**
   * For `generated`, a generator spec ("chladni:3,5", "bessel:2,3",
   * "faraday:hex") that the gallery draws in the browser. Otherwise an image
   * URL — Wikimedia originals are hot-linked from upload.wikimedia.org, never
   * copied into the repo, and carry their width/height so nothing shifts.
   */
  src: string;
  width?: number;
  height?: number;
  alt: string; // required, non-empty
  credit: string;
  license: string;
  licenseUrl?: string;
  sourceUrl?: string;
  lane?: Lane;
  tags: string[];
}

/** Each article opens with the same three-line box, in this order. */
export interface ArticleBox {
  established: string;
  contested: string;
  notSupported: string;
}

export interface Article {
  slug: string;
  title: string;
  standfirst: string; // one plain sentence
  /** `coming` renders a stub that says so; nothing pretends to be written. */
  state: "published" | "coming";
  box?: ArticleBox;
  /**
   * Markdown. Inline citations are `[@source-id]`, numbered in order of first
   * use and listed under the article; `[[event:id]]` links a timeline event.
   * The integrity check resolves both.
   */
  body?: string;
  relatedEvents?: string[];
}
