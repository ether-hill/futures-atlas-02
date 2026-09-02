/**
 * The arXiv lane.
 *
 * OpenAlex's is_core filter, which is what keeps the journal lane clean, also
 * excludes arXiv, and arXiv is where most of the AI and quantum work the Atlas
 * cares about actually appears first. So it gets its own pass: one query per
 * cluster that has arXiv categories, built from that cluster's own accept terms.
 *
 * Everything on arXiv is readable, which is the only bar this page sets for a
 * link. Nothing here is peer reviewed and the cards say so.
 *
 * The Atom response is parsed with regexes rather than an XML dependency. That
 * is fine for this feed and only this feed: the shape is fixed, the fields are
 * flat, and a malformed entry drops out instead of throwing.
 */
import { CLUSTERS, REVALIDATE_SECONDS, TOPICS, WINDOW_DAYS } from "@/data/horizon-scan";
import { REQUEST_TIMEOUT_MS } from "./openalex";
import type { RawRecord } from "./types";

const API = "https://export.arxiv.org/api/query";
const CONTACT = process.env.OPENALEX_CONTACT_EMAIL || "hello@frond.studio";

/** Phrases per topic contributed to its cluster's arXiv query. */
const PHRASES_PER_TOPIC = 3;
/** Ceiling on OR'd phrases in one query, so the URL stays sane. */
const MAX_PHRASES = 18;
/** Ceiling on the whole serial lane loop. */
const LANE_BUDGET_MS = 40_000;

/**
 * arXiv titles and abstracts are written in LaTeX and come back that way, so a
 * card was reading `two hybrid III--V/Si$_3$N$_4$ integrated lasers`. This is
 * not a TeX renderer and does not want to be: it drops the delimiters and the
 * commands and keeps the words, which is all a summary line needs.
 */
function detex(s: string): string {
  return s
    .replace(/\$\$([^$]*)\$\$/g, "$1")
    .replace(/\$([^$]*)\$/g, "$1")
    .replace(/\\(?:emph|textit|textbf|texttt|mathrm|mathbf|text)\{([^{}]*)\}/g, "$1")
    .replace(/\\[a-zA-Z]+\s?/g, "")
    .replace(/[{}]/g, "")
    .replace(/_\{?([0-9a-zA-Z]+)\}?/g, "$1")
    .replace(/\^\{?([0-9a-zA-Z]+)\}?/g, "$1")
    .replace(/---/g, "\u2014")
    .replace(/--/g, "\u2013")
    .replace(/``|''/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(entry: string, name: string): string | undefined {
  const m = entry.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? detex(decode(m[1])) : undefined;
}

function parseEntry(entry: string, viaTopic: string): RawRecord | null {
  const id = tag(entry, "id");
  const title = tag(entry, "title");
  const published = tag(entry, "published");
  if (!id || !title || !published) return null;

  const authors = Array.from(entry.matchAll(/<author>[\s\S]*?<name>([\s\S]*?)<\/name>[\s\S]*?<\/author>/g)).map(
    (m) => decode(m[1]),
  );
  const pdf = entry.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/)?.[1]
    ?? entry.match(/href="([^"]+)"[^>]*title="pdf"/)?.[1];
  const doi = tag(entry, "arxiv:doi");
  // Authors record where a preprint was eventually published, when it was. That
  // is a real journal name and worth more than the arXiv category code, which
  // only repeats the subject chips the entry already carries.
  const journalRef = tag(entry, "arxiv:journal_ref");

  return {
    id,
    source: "arxiv",
    title,
    abstract: tag(entry, "summary"),
    authors,
    venue: journalRef || "arXiv",
    reviewed: Boolean(journalRef),
    date: published.slice(0, 10),
    doi,
    url: id.replace(/^http:/, "https:"),
    pdfUrl: pdf?.replace(/^http:/, "https:"),
    institutions: [], // arXiv metadata carries no affiliations, and no ids
    authorIds: [],
    institutionIds: [],
    home: false,
    viaTopic,
  };
}

/** Accept terms make better arXiv probes than the OpenAlex ones: arXiv has no
 *  AND-inside-a-phrase syntax, so it wants plain quoted phrases. */
function clusterPhrases(clusterId: string): string[] {
  const phrases: string[] = [];
  for (const t of TOPICS.filter((t) => t.cluster === clusterId)) {
    const multiword = t.terms.filter((term) => term.includes(" "));
    for (const term of multiword.slice(0, PHRASES_PER_TOPIC)) phrases.push(term);
  }
  return phrases.slice(0, MAX_PHRASES);
}

function queryFor(cats: string[], phrases: string[]): string {
  const catExpr = cats.map((c) => `cat:${c}`).join(" OR ");
  const absExpr = phrases.map((p) => `abs:"${p}"`).join(" OR ");
  const params = new URLSearchParams({
    search_query: `(${catExpr}) AND (${absExpr})`,
    sortBy: "submittedDate",
    sortOrder: "descending",
    max_results: "25",
  });
  return `${API}?${params.toString()}`;
}

async function run(target: string, viaTopic: string): Promise<RawRecord[] | null> {
  try {
    const res = await fetch(target, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: { "User-Agent": `futures-atlas horizon-scan (${CONTACT})` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const xml = await res.text();
    const cutoff = Date.now() - WINDOW_DAYS * 86400_000;
    return Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g))
      .map((m) => parseEntry(m[1], viaTopic))
      .filter((r): r is RawRecord => r !== null && new Date(r.date).getTime() >= cutoff);
  } catch {
    return null;
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function fetchArxiv(): Promise<{ records: RawRecord[]; queries: number; failed: number }> {
  const lanes = CLUSTERS.filter((c) => c.arxivCats?.length).map((c) => ({
    via: `arxiv-${c.id}`,
    url: queryFor(c.arxivCats!, clusterPhrases(c.id)),
  }));

  // arXiv's terms ask for one request at a time with three seconds between
  // them, and it does start refusing if you crowd it (a 700ms gap, which this
  // used, got most of a run rejected). Six lanes is therefore about twenty
  // seconds, which costs nothing on something that runs once a day and overlaps
  // the OpenAlex half anyway.
  //
  // The whole lane loop is on a deadline as well as each request. Serial work
  // with sleeps in it is the one part of a run that can grow without bound when
  // the far end is unwell, and this has to finish inside a function timeout.
  const deadline = Date.now() + LANE_BUDGET_MS;
  const records: RawRecord[] = [];
  let failed = 0;
  for (const [i, lane] of lanes.entries()) {
    if (Date.now() > deadline) {
      failed += lanes.length - i;
      break;
    }
    if (i > 0) await sleep(3000);
    const page = await run(lane.url, lane.via);
    if (page === null) failed++;
    else records.push(...page);
  }
  return { records, queries: lanes.length, failed };
}
