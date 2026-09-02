/**
 * The OpenAlex lane.
 *
 * Two things make the difference between a usable feed and a wall of noise, and
 * both are filters on the query rather than cleanup afterwards:
 *
 *   primary_location.source.is_core  OpenAlex's curated set of real journals.
 *     Without it a date-sorted query is roughly nine-tenths Zenodo self-deposits
 *     and pay-to-publish titles, because those are what get date-stamped fastest.
 *   to_publication_date = today  journals stamp issues months ahead, so a plain
 *     date-descending sort opens with papers "published" next December.
 *
 * Everything is open access by construction (open_access.is_oa), which is the
 * point: every link on the page has to go somewhere a reader can actually read.
 *
 * OpenAlex meters keyless callers on credits, not requests per second: 1000 a
 * day, a flat 10 for any search regardless of how many rows it returns. So the
 * shape of this file is set by that. Few queries, fat pages, and a long cache.
 * See QUERY_GROUPS and REVALIDATE_SECONDS in data/horizon-scan.ts. Going over
 * returns 429, which is why run() retries once on one.
 */
import {
  ABSTRACT_CHARS,
  HOME_INSTITUTIONS,
  PER_QUERY,
  QUERY_GROUPS,
  REVALIDATE_SECONDS,
  TOPICS,
  WINDOW_DAYS,
} from "@/data/horizon-scan";
import type { RawRecord } from "./types";

const API = "https://api.openalex.org/works";

/**
 * Per-request ceiling. See the note at the fetch call.
 *
 * Generous, because the ceiling is not there to keep a healthy run fast — a
 * grouped search answers in well under a second on its own — it is there so one
 * sick upstream cannot spend the whole function budget. Ten seconds was too
 * tight once eight of these ran at once with fifty rows of inverted-index
 * abstracts each: seventeen of twenty-two aborted mid-flight, and an aborted
 * request is not even charged, so the failure looked like a refusal.
 */
export const REQUEST_TIMEOUT_MS = 25_000;

/** Burst 429s clear in well under a second, so a couple of backoffs is plenty. */
const MAX_RETRIES = 3;
const MAILTO = process.env.OPENALEX_CONTACT_EMAIL || "hello@frond.studio";

/**
 * Optional, free, and worth setting.
 *
 * Keyless callers share a budget of $0.10 a day (1000 credits, measured off the
 * response headers). One run of this page is about 230 of those, which fits —
 * except the keyless budget is not ours alone. On Vercel the egress IP is shared
 * with other customers, and openalex.org's own site draws on the same pool, so
 * in production the allowance can be gone before this page asks for anything.
 * That shows up as "N of 28 queries did not answer" and a short list.
 *
 * A free OpenAlex account gives a key with ten times the budget, tied to the
 * account rather than to whoever else is behind the same IP. No payment method.
 * Set OPENALEX_API_KEY on the Vercel project and this picks it up; unset, it
 * behaves exactly as before.
 */
const API_KEY = process.env.OPENALEX_API_KEY;

export function openAlexHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": `futures-atlas horizon-scan (${MAILTO})`,
  };
  if (API_KEY) headers.Authorization = `Bearer ${API_KEY}`;
  return headers;
}

const SELECT = [
  "id",
  "doi",
  "title",
  "publication_date",
  "type",
  "authorships",
  "primary_location",
  "best_oa_location",
  "abstract_inverted_index",
  "cited_by_count",
  // Every copy of the paper, not just the best one: an arXiv twin is where a
  // journal paper's figure comes from. Costs nothing — same query.
  "locations",
].join(",");

/** OpenAlex indexes anything with a DOI. These are not papers. */
const NON_ARTICLE_TYPES = new Set([
  "dataset",
  "paratext",
  "peer-review",
  "reference-entry",
  "libguides",
  "supplementary-materials",
  "grant",
  "erratum",
  "editorial",
  "letter",
  "standard",
  "other",
]);

/** Deposit shells. The version of record is what we want to cite. */
const REPOSITORIES = [
  "zenodo",
  "figshare",
  "research square",
  "ssrn",
  "academia.edu",
  "researchgate",
  "preprints.org",
  "authorea",
  "osf",
  "mendeley data",
  "dryad",
];

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** OpenAlex stores abstracts as a word to positions map. Put it back. */
function reconstructAbstract(index: Record<string, number[]>): string {
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const p of positions) words[p] = word;
  }
  return words.filter(Boolean).join(" ");
}

/** Figshare and friends hand OpenAlex titles with JATS tags still in them. */
export function stripMarkup(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface OaAuthorship {
  author?: { id?: string; display_name?: string };
  institutions?: { id?: string; display_name?: string; ror?: string }[];
}

interface OaWork {
  id?: string;
  doi?: string | null;
  title?: string | null;
  publication_date?: string;
  type?: string;
  authorships?: OaAuthorship[];
  primary_location?: {
    source?: { id?: string; display_name?: string } | null;
    landing_page_url?: string | null;
  } | null;
  best_oa_location?: { pdf_url?: string | null; landing_page_url?: string | null } | null;
  abstract_inverted_index?: Record<string, number[]> | null;
  cited_by_count?: number;
  locations?: {
    landing_page_url?: string | null;
    pdf_url?: string | null;
    source?: { display_name?: string } | null;
  }[];
}

const HOME_RORS = new Set(HOME_INSTITUTIONS.rors.map((r) => `https://ror.org/${r}`));

function parse(work: OaWork, viaTopic: string): RawRecord | null {
  const title = stripMarkup(work.title ?? "");
  if (!title || !work.id) return null;
  if (work.type && NON_ARTICLE_TYPES.has(work.type)) return null;

  const source = work.primary_location?.source ?? undefined;
  const venue = source?.display_name ?? undefined;
  if (venue && REPOSITORIES.some((r) => venue.toLowerCase().includes(r))) return null;

  const authorships = work.authorships ?? [];
  const institutions = Array.from(
    new Set(
      authorships.flatMap((a) => (a.institutions ?? []).map((i) => i.display_name ?? "")).filter(Boolean),
    ),
  );
  const home = authorships.some((a) => (a.institutions ?? []).some((i) => i.ror && HOME_RORS.has(i.ror)));

  // First and last author only; see the note on RawRecord.authorIds.
  const ends = authorships.length > 1 ? [authorships[0], authorships[authorships.length - 1]] : authorships;
  const authorIds = Array.from(
    new Set(ends.map((a) => a.author?.id).filter((id): id is string => Boolean(id))),
  );
  const institutionIds = Array.from(
    new Set(
      authorships
        .flatMap((a) => (a.institutions ?? []).map((i) => i.id))
        .filter((id): id is string => Boolean(id)),
    ),
  ).slice(0, 4);

  const doi = work.doi ? work.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "") : undefined;
  const oa = work.best_oa_location ?? undefined;
  const url =
    oa?.landing_page_url ||
    (doi ? `https://doi.org/${doi}` : "") ||
    work.primary_location?.landing_page_url ||
    work.id;

  const abstractRaw = work.abstract_inverted_index
    ? reconstructAbstract(work.abstract_inverted_index)
    : "";
  // Publishers routinely put the word "Abstract" (or "Abstract:") at the head of
  // the abstract itself, and OpenAlex keeps it. On a card it reads as a stutter.
  const abstract = abstractRaw
    ? stripMarkup(abstractRaw).replace(/^abstract[:.\s—-]+/i, "")
    : "";

  return {
    id: work.id,
    source: "openalex",
    title,
    abstract: abstract
      ? abstract.length > ABSTRACT_CHARS
        ? `${abstract.slice(0, ABSTRACT_CHARS).trimEnd()}…`
        : abstract
      : undefined,
    authors: authorships.map((a) => a.author?.display_name ?? "").filter(Boolean),
    venue,
    reviewed: true, // is_core journals only; see the filter on the query
    date: work.publication_date ?? "",
    doi,
    url,
    // Any copy's PDF, not only the one OpenAlex calls best: the "best" location
    // often has no pdf_url at all while a mirror does, and the thumbnail
    // renderer only needs a file it can open.
    pdfUrl:
      oa?.pdf_url ??
      (work.locations ?? []).find((l) => l?.pdf_url)?.pdf_url ??
      undefined,
    citedBy: work.cited_by_count,
    institutions,
    sourceId: source?.id,
    arxivUrl: (work.locations ?? []).find((l) =>
      /arxiv\.org\/abs\//i.test(l?.landing_page_url ?? ""),
    )?.landing_page_url ?? undefined,
    authorIds,
    institutionIds,
    home,
    viaTopic,
  };
}

/** `(probe) OR (probe) OR …` — parens because probes may carry their own AND. */
function searchExpr(probes: string[]): string {
  return probes.map((p) => `(${p})`).join(" OR ");
}

function url(params: Record<string, string>): string {
  const q = new URLSearchParams({ ...params, select: SELECT, mailto: MAILTO });
  return `${API}?${q.toString()}`;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function run(target: string, viaTopic: string, attempt = 0): Promise<RawRecord[] | null> {
  try {
    const res = await fetch(target, {
      next: { revalidate: REVALIDATE_SECONDS },
      headers: openAlexHeaders(),
      // A hung upstream must not be able to spend the whole function budget:
      // one slow query would take the page down rather than just itself.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // A 429 is one of two things and they want opposite treatment. If credits
    // remain, it is a momentary burst limit and one short wait clears it. If
    // the daily allowance is spent (`x-ratelimit-remaining: 0`) nothing clears
    // it until the reset hours later, so retrying just makes a degraded run
    // slow: 22 queries each sleeping out a Retry-After turned an 8-second
    // render into 66.
    if (res.status === 429 && attempt < MAX_RETRIES) {
      /*
       * Two different 429s, wanting opposite treatment.
       *
       * The daily allowance being spent is permanent until the reset hours
       * later, so retrying only makes a degraded run slow. A burst limit is
       * momentary and a short wait clears it.
       *
       * `x-ratelimit-remaining` tells them apart — but OpenAlex OMITS that
       * header on a 429, and the first version of this read `Number(null)` as
       * 0 and treated every burst limit as an exhausted allowance. Silently:
       * it returned before the logging, so seventeen of twenty-two queries
       * vanished each run with no error anywhere. Read the header as absent,
       * not as zero.
       */
      const header = res.headers.get("x-ratelimit-remaining");
      const remaining = header === null ? null : Number(header);
      if (remaining !== null && Number.isFinite(remaining) && remaining <= 0) {
        if (process.env.NODE_ENV !== "production")
          console.error(`[scan] ${viaTopic} 429, daily allowance spent`);
        return null;
      }
      const after = Number(res.headers.get("retry-after")) * 1000;
      const wait = Number.isFinite(after) && after > 0 ? Math.min(after, 3000) : 400 * 2 ** attempt;
      await sleep(wait);
      return run(target, viaTopic, attempt + 1);
    }
    if (!res.ok) {
      if (process.env.NODE_ENV !== "production")
        console.error(`[scan] ${viaTopic} HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
      return null;
    }
    const data = (await res.json()) as { results?: OaWork[] };
    return (data.results ?? []).map((w) => parse(w, viaTopic)).filter((r): r is RawRecord => r !== null);
  } catch (e) {
    if (process.env.NODE_ENV !== "production")
      console.error(`[scan] ${viaTopic} threw ${(e as Error)?.name}: ${(e as Error)?.message}`);
    return null;
  }
}

/** A group's probes are its topics' probes, OR'd into one call. */
function groupQuery(topicIds: string[]): string {
  const probes = topicIds.flatMap((id) => TOPICS.find((t) => t.id === id)?.probes ?? []);
  return url({
    filter: [
      "open_access.is_oa:true",
      "type:article",
      "language:en",
      "primary_location.source.is_core:true",
      `from_publication_date:${isoDaysAgo(WINDOW_DAYS)}`,
      `to_publication_date:${today()}`,
      `title_and_abstract.search:${searchExpr(probes)}`,
    ].join(","),
    sort: "publication_date:desc",
    per_page: String(PER_QUERY),
  });
}

/** A topic left out of every group would silently stop being retrieved, and the
 *  page would still look fine. Fail loudly instead. */
function assertGroupsCoverTopics(): void {
  const grouped = new Set(QUERY_GROUPS.flatMap((g) => g.topics));
  const missing = TOPICS.filter((t) => !grouped.has(t.id)).map((t) => t.id);
  if (missing.length > 0) {
    throw new Error(`horizon-scan: topics in no QUERY_GROUP: ${missing.join(", ")}`);
  }
  const unknown = Array.from(grouped).filter((id) => !TOPICS.some((t) => t.id === id));
  if (unknown.length > 0) {
    throw new Error(`horizon-scan: QUERY_GROUP names unknown topics: ${unknown.join(", ")}`);
  }
}

/**
 * The home-institution lane. Delft publishes several thousand open papers a
 * year, most of them about something else, so this is still a keyword query;
 * it just uses one broad net per half of the taxonomy instead of the tight
 * per-topic ones, and lets the local rules do the sorting.
 */
function homeQueries(): { url: string; via: string }[] {
  const nets: [string, string[]][] = [
    [
      "home-hard",
      ['"quantum"', '"semiconductor"', '"data center"', '"data centre"', '"photonic"', '"energy transition"'],
    ],
    [
      "home-soft",
      [
        '"artificial intelligence"',
        '"responsible innovation"',
        '"design for values"',
        '"foresight"',
        '"scenario"',
        '"public engagement"',
        '"sociotechnical"',
      ],
    ],
  ];
  return nets.map(([via, probes]) => ({
    via,
    url: url({
      filter: [
        "open_access.is_oa:true",
        "type:article",
        "language:en",
        `authorships.institutions.ror:${HOME_INSTITUTIONS.rors.map((r) => `https://ror.org/${r}`).join("|")}`,
        `from_publication_date:${isoDaysAgo(WINDOW_DAYS)}`,
        `to_publication_date:${today()}`,
        `title_and_abstract.search:${searchExpr(probes)}`,
      ].join(","),
      sort: "publication_date:desc",
      per_page: String(PER_QUERY),
    }),
  }));
}

/** Run `jobs` with at most `limit` in flight. OpenAlex meters credits per query
 *  rather than requests per second, so concurrency costs nothing and only the
 *  number of queries does. Five, not eight: these responses carry fifty
 *  reconstructable abstracts apiece and eight in flight was enough to push them
 *  past the per-request ceiling. */
async function pool<T>(jobs: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const out: T[] = new Array(jobs.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, jobs.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= jobs.length) return;
      out[i] = await jobs[i]();
    }
  });
  await Promise.all(workers);
  return out;
}

export async function fetchOpenAlex(): Promise<{ records: RawRecord[]; queries: number; failed: number }> {
  assertGroupsCoverTopics();
  const jobs = [
    ...QUERY_GROUPS.map((g) => () => run(groupQuery(g.topics), g.id)),
    ...homeQueries().map((h) => () => run(h.url, h.via)),
  ];
  const pages = await pool(jobs, 5);
  const failed = pages.filter((p) => p === null).length;
  return {
    records: pages.flatMap((p) => p ?? []),
    queries: jobs.length,
    failed,
  };
}
