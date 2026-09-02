/**
 * The authority pass: what the index knows about who wrote a paper, where it
 * was published, and from where.
 *
 * Be clear about what this measures. Every figure here is a citation count in
 * some costume: a journal's two-year mean citations per paper, an author's
 * h-index, an institution's two-year mean. Those track attention, not quality,
 * and the attention is unevenly handed out, towards established groups, rich
 * departments, English-language venues and fields that cite quickly. A first
 * paper out of a small department is not worse than a Nature Communications
 * paper from a large one; it is less cited, which is a different fact.
 *
 * So it is worth a nudge and not a verdict. `AUTHORITY_WEIGHT` is small next to
 * what the rules contribute, a paper with no figures at all is not pushed down
 * for it (missing reads as neutral, not as zero), and the numbers themselves
 * are printed beside the paper rather than folded into a score nobody can see.
 * There is also a sort that puts standing first, for when that is the question.
 *
 * The cost is nothing. OpenAlex charges 10 credits for a search but 1 for a
 * filter by id, so the whole pass is single figures against a daily thousand,
 * which is why it can afford to look up every held paper rather than the top
 * few.
 */
import { REVALIDATE_SECONDS } from "@/data/horizon-scan";
import { REQUEST_TIMEOUT_MS, openAlexHeaders } from "./openalex";
import type { RawRecord, Standing } from "./types";

const MAILTO = process.env.OPENALEX_CONTACT_EMAIL || "";

/** OpenAlex accepts up to 50 values in one OR'd filter. */
const CHUNK = 50;

interface Stats {
  "2yr_mean_citedness"?: number;
  h_index?: number;
  i10_index?: number;
}
interface Entity {
  id?: string;
  display_name?: string;
  summary_stats?: Stats;
}

function chunk<T>(xs: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** OpenAlex ids arrive as full URLs; the filter wants the bare key. */
const key = (id: string) => id.replace(/^https?:\/\/openalex\.org\//, "");

async function fetchEntities(path: string, ids: string[]): Promise<Map<string, Entity>> {
  const found = new Map<string, Entity>();
  const pages = await Promise.all(
    chunk(ids, CHUNK).map(async (group) => {
      const url =
        `https://api.openalex.org/${path}` +
        `?filter=openalex_id:${group.map(key).join("|")}` +
        `&select=id,display_name,summary_stats&per_page=${CHUNK}` +
        (MAILTO ? `&mailto=${encodeURIComponent(MAILTO)}` : "");
      try {
        const res = await fetch(url, {
          next: { revalidate: REVALIDATE_SECONDS },
          headers: openAlexHeaders(),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as { results?: Entity[] };
        return data.results ?? [];
      } catch {
        return [];
      }
    }),
  );
  for (const e of pages.flat()) if (e.id) found.set(e.id, e);
  return found;
}

/**
 * Squash an unbounded, very long-tailed count into 0-1.
 *
 * `soft` is the value that lands at about 0.5, chosen per measure from what a
 * respectable one looks like: a journal cited five times per paper over two
 * years, an author on an h-index of 40, an institution on a two-year mean of 4.
 * Log, because the difference between 1 and 5 is the interesting one and the
 * difference between 200 and 400 is not.
 */
function squash(value: number | undefined, soft: number): number | undefined {
  if (value == null || !Number.isFinite(value) || value <= 0) return undefined;
  return Math.min(1, Math.log1p(value) / Math.log1p(soft * 2));
}

const SOFT_VENUE = 5;
const SOFT_AUTHOR = 40;
const SOFT_INSTITUTION = 4;

/** How much the rollup is allowed to move a paper, in the same points as the
 *  rest of the ranking (where fresh-vs-stale is worth 6 and convergence 5). */
export const AUTHORITY_WEIGHT = 4;

export async function fetchStanding(
  records: RawRecord[],
): Promise<Map<string, Standing>> {
  const sourceIds = Array.from(
    new Set(records.map((r) => r.sourceId).filter((s): s is string => Boolean(s))),
  );
  const authorIds = Array.from(new Set(records.flatMap((r) => r.authorIds)));
  const instIds = Array.from(new Set(records.flatMap((r) => r.institutionIds)));

  const [sources, authors, institutions] = await Promise.all([
    sourceIds.length ? fetchEntities("sources", sourceIds) : new Map<string, Entity>(),
    authorIds.length ? fetchEntities("authors", authorIds) : new Map<string, Entity>(),
    instIds.length ? fetchEntities("institutions", instIds) : new Map<string, Entity>(),
  ]);

  const out = new Map<string, Standing>();
  for (const rec of records) {
    const source = rec.sourceId ? sources.get(rec.sourceId) : undefined;
    const venueCitedness = source?.summary_stats?.["2yr_mean_citedness"];

    let authorH: number | undefined;
    let authorName: string | undefined;
    for (const id of rec.authorIds) {
      const h = authors.get(id)?.summary_stats?.h_index;
      if (h != null && (authorH == null || h > authorH)) {
        authorH = h;
        authorName = authors.get(id)?.display_name;
      }
    }

    let instCitedness: number | undefined;
    let instName: string | undefined;
    for (const id of rec.institutionIds) {
      const c = institutions.get(id)?.summary_stats?.["2yr_mean_citedness"];
      if (c != null && (instCitedness == null || c > instCitedness)) {
        instCitedness = c;
        instName = institutions.get(id)?.display_name;
      }
    }

    const parts = [
      { v: squash(venueCitedness, SOFT_VENUE), w: 0.5 },
      { v: squash(authorH, SOFT_AUTHOR), w: 0.3 },
      { v: squash(instCitedness, SOFT_INSTITUTION), w: 0.2 },
    ].filter((p) => p.v !== undefined) as { v: number; w: number }[];

    if (parts.length === 0) continue;

    // Renormalise over the parts that exist, so a paper with a known journal
    // and unknown authors is not scored as though its authors were nobodies.
    const weight = parts.reduce((s, p) => s + p.w, 0);
    const score = parts.reduce((s, p) => s + p.v * p.w, 0) / weight;

    out.set(rec.id, {
      venueCitedness,
      venueName: source?.display_name,
      authorH,
      authorName,
      instCitedness,
      instName,
      score: Math.round(score * 100) / 100,
    });
  }
  return out;
}
