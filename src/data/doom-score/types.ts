/**
 * The Doom Score ledger: every row is one moment somebody put a number (or a
 * named fear) on humanity's extinction or permanent collapse. The timeline,
 * the film, the article and the instrument are all views of this one list.
 *
 * Rules, in order of importance:
 *  1. Nothing goes in without a source URL and a verbatim quote read in that
 *     source. `verified: false` marks a row taken from a secondary list whose
 *     primary source could not be opened yet; it draws hollow.
 *  2. `p` is a percent point estimate (0–100). A range goes in pLow/pHigh; a
 *     row may have both (a point inside a range) or neither (a statement
 *     without a number, which plays as texture, not a pitched note).
 *  3. Dates are ISO. YYYY-MM or YYYY are allowed when the source gives no
 *     more; the axis places them mid-period.
 */
export type MentionType =
  | "paper"
  | "book"
  | "interview"
  | "survey"
  | "forum"
  | "article"
  | "market"
  | "statement"
  | "talk";

/**
 * What the number is about. p(doom) proper is `ai`. The rows before the word
 * existed put odds on the bomb or on extinction from any cause; they stay in
 * the timeline as the prehistory, drawn as a different mark.
 */
export type MentionScope = "ai" | "any" | "nuclear";

export const SCOPE_LABEL: Record<MentionScope, string> = {
  ai: "AI",
  any: "Any cause",
  nuclear: "Nuclear",
};

export interface Mention {
  id: string;
  date: string;
  scope: MentionScope;
  who: string;
  role?: string;
  p?: number;
  pLow?: number;
  pHigh?: number;
  horizon?: string;
  type: MentionType;
  quote: string;
  source: { title: string; url: string; outlet?: string };
  reach?: number;
  note?: string;
  verified: boolean;
}

export const TYPE_LABEL: Record<MentionType, string> = {
  paper: "Paper",
  book: "Book",
  interview: "Interview",
  survey: "Survey",
  forum: "Forum post",
  article: "Article",
  market: "Market",
  statement: "Statement",
  talk: "Talk",
};

/** One monthly bucket of how much the world was talking about it. */
export interface VolumePoint {
  month: string; // YYYY-MM
  count: number;
}

/** One thing the nets caught: a story, post, paper, video or market. */
export type FeedKind = "news" | "paper" | "forum" | "social" | "video" | "market" | "book" | "survey";

export const FEED_KIND_LABEL: Record<FeedKind, string> = {
  news: "News",
  paper: "Papers",
  forum: "Forum posts",
  social: "Social posts",
  video: "Video and audio",
  market: "Markets",
  book: "Books",
  survey: "Surveys",
};

export interface FeedItem {
  date: string; // YYYY-MM-DD
  title: string;
  url: string;
  host: string;
  kind: FeedKind;
  via: string; // where the net caught it
  viaUrl?: string;
  score?: number | null;
  comments?: number | null;
  author?: string;
  probability?: number | null; // markets: current %, one decimal
  resolved?: boolean | null;
  ledgerId?: string; // when it is the source of a ledger row
  who?: string;
  snippet?: string; // a caption or abstract fragment, the source's own words
  theme?: string; // markets: doom | pause | agi
}

export interface FeedNet {
  name: string;
  status: string;
  items: number;
  error: string | null;
}
