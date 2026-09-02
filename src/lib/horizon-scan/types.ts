import type { ClusterId } from "@/data/horizon-scan";

/** One record as it comes back from an index, before the rules touch it. */
export interface RawRecord {
  /** Stable id from the index (OpenAlex work id, or arXiv abs URL). */
  id: string;
  source: "openalex" | "arxiv";
  title: string;
  abstract?: string;
  authors: string[];
  /** Journal or conference name. "arXiv" when a preprint has no journal yet. */
  venue?: string;
  /** False for an arXiv posting with no journal behind it. Drives the "not peer
   *  reviewed" note, which is the one thing a reader needs to know about a
   *  preprint and is not obvious from the word. */
  reviewed: boolean;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  doi?: string;
  /** Where a reader actually lands. Always open access by construction. */
  url: string;
  /** Direct PDF if the index knows one. */
  pdfUrl?: string;
  citedBy?: number;
  /** Institution names on the byline, deduped. */
  institutions: string[];
  /** OpenAlex ids, used by the authority pass. Absent for arXiv records. */
  sourceId?: string;
  /** Where this paper also sits on arXiv, when it does. A journal paper with an
   *  arXiv twin can borrow its figure; roughly one in twelve of them has one. */
  arxivUrl?: string;
  /** First and last author: in most of these fields those are the two that
   *  carry the standing, and looking up every name would be four times the ids
   *  for very little more signal. */
  authorIds: string[];
  institutionIds: string[];
  /** True if a home institution (see HOME_INSTITUTIONS) is on the byline. */
  home: boolean;
  /** Which topic's query returned it. Retrieval only; the rules decide keeps. */
  viaTopic: string;
}

/** A record that passed the rules, with everything the page needs to explain why. */
export interface ScannedPaper extends RawRecord {
  /** Topic ids matched, by the topic's own `terms`. Never empty. */
  topics: string[];
  /** The subset matched in the title or more than once, not in passing. */
  solidTopics: string[];
  /** Clusters those topics belong to, deduped. */
  clusters: ClusterId[];
  /** The subset matched in the title or twice over: what the paper is ABOUT,
   *  as opposed to what it mentions. */
  strongClusters: ClusterId[];
  /** Two or more strong clusters. The reason this page is one page. */
  convergent: boolean;
  /** The specific phrases that matched, for the "why this is here" line. */
  hits: string[];
  /** Reputation signals, all of them citation counts wearing a hat. Null where
   *  the index has nothing, which is every arXiv record. See authority.ts. */
  standing: Standing | null;
  /** 0-1: does it read like a finding or like a framework? See interest.ts. */
  spark: number;
  /** The claim and stakes phrases behind that number. */
  claims: string[];
  /** The dull markers behind it. The rule is printed both ways round. */
  drags: string[];
  /** The paper's own strongest sentence, extracted, never written. */
  keySentence?: string;
  /** A picture for the card: a figure hot-linked from the paper's arXiv copy,
   *  or failing that its rendered title page as a data URI. See figures.ts. */
  figure?: { url: string; caption?: string; kind?: "figure" | "page" };
  /** The subject it lands in hardest: what the per-subject cap counts against. */
  primaryCluster: ClusterId;
  score: number;
}

/** What the authority pass found out about a paper's venue, people and places.
 *  Raw numbers are kept alongside the 0-1 rollup so the page can show its
 *  working rather than a mystery number. */
export interface Standing {
  /** Journal's mean citations per paper over two years, impact-factor-ish. */
  venueCitedness?: number;
  venueName?: string;
  /** Highest h-index across the first and last author. */
  authorH?: number;
  authorName?: string;
  /** Best-cited institution on the byline, by its own 2-year mean. */
  instCitedness?: number;
  instName?: string;
  /** 0-1 rollup of whatever of the above exists. */
  score: number;
}

/** What the page renders, including the parts where nothing came back. */
export interface ScanResult {
  papers: ScannedPaper[];
  /** ISO timestamp of the run that produced this (cached with the data). */
  ranAt: string;
  stats: {
    queries: number;
    retrieved: number;
    /** Records dropped as a second copy of one already kept (a preprint and its
     *  journal version, or the same record ingested twice). */
    duplicates: number;
    /** Passed every rule. May exceed what is rendered (MAX_HELD). */
    kept: number;
    /** Held after the rules, before the display cap. */
    shown: number;
    /** Rejected for matching no topic. */
    offTopic: number;
    /** Rejected for matching one topic once: a mention, not a subject. */
    thin: number;
    /** Rejected by the venue or text blocklists. */
    binned: number;
    convergent: number;
    home: number;
    /** Queries that errored or timed out. Surfaced, never hidden. */
    failed: number;
    /** Held papers the authority pass found a venue, author or institution
     *  figure for. The rest rank on the rules alone. */
    withStanding: number;
    /** Held papers pushed down the order by the per-subject cap. */
    capped: number;
    /** Digest papers a figure was found for. */
    withFigure: number;
  };
}
