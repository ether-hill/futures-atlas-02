/**
 * Retrieval is wide, the rules are narrow, and the rules run here.
 *
 * A record is kept only if its own text contains an accept term from at least
 * one topic. Which query found it is irrelevant to that decision, so a paper
 * pulled in by the quantum lane can be kept, and tagged, by the power and
 * society topics it also matches. That is where the convergence marks come from
 * and it is the only reason these nine subjects share a page.
 */
import {
  CLUSTERS,
  DIGEST_PER_SUBJECT,
  MAX_HELD,
  MAX_PER_SUBJECT,
  SPARK_WEIGHT,
  TOP_PICKS,
  REVALIDATE_SECONDS,
  MIN_SOLID_TOPICS,
  MIN_WEAK_TOPICS,
  TEXT_BLOCK,
  TOPICS,
  VENUE_BLOCK,
  WINDOW_DAYS,
  type ClusterId,
} from "@/data/horizon-scan";
import { fetchArxiv } from "./arxiv";
import { AUTHORITY_WEIGHT, fetchStanding } from "./authority";
import { attachFigures } from "./figures";
import { readInterest } from "./interest";
import { fetchOpenAlex } from "./openalex";
import type { RawRecord, ScanResult, ScannedPaper } from "./types";

const CLUSTER_ORDER = CLUSTERS.map((c) => c.id);

interface Match {
  topics: string[];
  /** The subset matched in the title or more than once. Never a passing mention. */
  solid: string[];
  clusters: ClusterId[];
  /** Clusters matched solidly. Convergence is counted on these. */
  strong: ClusterId[];
  hits: string[];
  titleHit: boolean;
}

const occurrences = (haystack: string, needle: string): number => {
  let n = 0;
  let i = haystack.indexOf(needle);
  while (i !== -1) {
    n++;
    i = haystack.indexOf(needle, i + needle.length);
  }
  return n;
};

/**
 * A subject in the title, or worth two mentions in the text, is what the paper
 * is about. A single word once in the middle of an abstract is an aside, and
 * asides were the whole of the first run's false convergence: a semiconductor
 * packaging paper that said "quantum computing" once in its opening sentence
 * came out tagged as quantum work and ranked above things that actually were.
 *
 * So both are recorded. The weak match still tags the card, because it is true
 * and a reader may want it. Only the strong one counts toward convergent.
 */
function matchRules(rec: RawRecord): Match {
  const title = rec.title.toLowerCase();
  const haystack = `${title} ${(rec.abstract ?? "").toLowerCase()}`;
  const topics: string[] = [];
  const solid: string[] = [];
  const clusters = new Set<ClusterId>();
  const inTitleClusters = new Set<ClusterId>();
  // Weight per cluster, summed over every term it matched. Two different words
  // from the same subject, once each, is a paper engaging with that subject;
  // one word once is a mention.
  const weight = new Map<ClusterId, number>();
  const hits: string[] = [];
  let titleHit = false;

  for (const topic of TOPICS) {
    const found = topic.terms.filter((term) => haystack.includes(term));
    if (found.length === 0) continue;
    topics.push(topic.id);
    clusters.add(topic.cluster);
    hits.push(...found);
    const inTitle = found.some((term) => title.includes(term));
    if (inTitle) {
      titleHit = true;
      inTitleClusters.add(topic.cluster);
    }
    const n = found.reduce((sum, term) => sum + occurrences(haystack, term), 0);
    weight.set(topic.cluster, (weight.get(topic.cluster) ?? 0) + n);
    if (inTitle || n >= 2) solid.push(topic.id);
  }

  const strong = CLUSTER_ORDER.filter(
    (c) => inTitleClusters.has(c) || (weight.get(c) ?? 0) >= 2,
  );

  return {
    topics,
    solid,
    clusters: CLUSTER_ORDER.filter((c) => clusters.has(c)),
    strong,
    hits: Array.from(new Set(hits)),
    titleHit,
  };
}



/** The bin, applied after a topic match. See the lists in data/horizon-scan.ts. */
function binned(rec: RawRecord): boolean {
  const venue = (rec.venue ?? "").toLowerCase();
  if (venue && VENUE_BLOCK.some((b) => venue.includes(b))) return true;
  const text = `${rec.title} ${rec.abstract ?? ""}`.toLowerCase();
  return TEXT_BLOCK.some((b) => text.includes(b));
}

function normDoi(doi?: string): string | null {
  if (!doi) return null;
  return doi
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")
    .replace(/\/v\d+$/, "")
    .toLowerCase()
    .trim();
}

/** Same paper, different DOI: an arXiv preprint and the journal version of it. */
function titleKey(rec: RawRecord): string {
  const title = rec.title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 80);
  const surname =
    rec.authors[0]
      ?.toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .split(/\s+/)
      .pop()
      ?.replace(/[^a-z]/g, "") ?? "";
  return `${title}|${surname}`;
}

function ageDays(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return WINDOW_DAYS;
  return Math.max(0, (Date.now() - t) / 86400_000);
}

/**
 * Ranking, in plain terms: fresh beats old, several topics beats one, several
 * subjects matched HARD beats several topics, a match in the title beats a match
 * buried in an abstract. Survey papers take a hit, because a mega-journal produces a dozen a week and they are
 * not what anyone came for. Citations barely matter, because nothing published
 * inside the window has any yet.
 */
function score(rec: RawRecord, m: Match, spark: number): number {
  let s = 0;
  s += 6 * (1 - Math.min(1, ageDays(rec.date) / WINDOW_DAYS));
  s += Math.min(3, m.topics.length) * 2.5;
  if (m.strong.length >= 2) s += 5;
  if (m.strong.length >= 3) s += 2;
  if (m.titleHit) s += 3;
  if (rec.pdfUrl) s += 0.5;
  s += Math.min(3, Math.log10(1 + (rec.citedBy ?? 0)) * 2);
  // Does it read like a finding or like a framework? See interest.ts. A plain
  // paper sits at about 0.45 of this, so it is a spread rather than a penalty.
  s += spark * SPARK_WEIGHT;
  return Math.round(s * 10) / 10;
}

/**
 * Retrieval is the slow, metered half of a run, and it does not change when a
 * rule does. In development the raw records are parked on disk so that editing
 * data/horizon-scan.ts, the scoring, or the layout costs nothing and takes no
 * time; delete the file (or wait out the window) for a fresh pull. Production
 * never reads it: there the whole finished run is cached in KV instead, which
 * is what lib/horizon-scan/cache.ts does.
 *
 * **Not inside `.next`.** That was the first version of this and it broke the
 * dev server: `next dev` watches its own output directory, so writing a file
 * under `.next/cache` mid-request triggered a recompile that deleted
 * `.next/server/app/(atlas)/horizon-scan/page.js` out from under the next
 * request. The symptom was a 404, then a 500 (`ENOENT ... page.js`), then
 * normal service until the following write. `node_modules/.cache` is the
 * conventional place for this and is not watched.
 */
const DEV_RAW = "node_modules/.cache/horizon-scan-raw.json";

interface RawPayload {
  at: number;
  raw: RawRecord[];
  queries: number;
  failed: number;
}

async function readDevRaw(): Promise<RawPayload | null> {
  if (process.env.NODE_ENV === "production") return null;
  try {
    const { readFile } = await import("node:fs/promises");
    const p = JSON.parse(await readFile(DEV_RAW, "utf8")) as RawPayload;
    if (!p?.at || !Array.isArray(p.raw)) return null;
    if (Date.now() - p.at > REVALIDATE_SECONDS * 1000) return null;
    return p;
  } catch {
    return null;
  }
}

async function writeDevRaw(p: RawPayload): Promise<void> {
  if (process.env.NODE_ENV === "production") return;
  try {
    const { writeFile, mkdir } = await import("node:fs/promises");
    await mkdir("node_modules/.cache", { recursive: true });
    await writeFile(DEV_RAW, JSON.stringify(p));
  } catch {
    // A missing cache is a slow dev reload, not a failure.
  }
}

async function retrieve(): Promise<RawPayload> {
  const cached = await readDevRaw();
  if (cached) return cached;
  const [oa, ax] = await Promise.all([fetchOpenAlex(), fetchArxiv()]);
  const payload: RawPayload = {
    at: Date.now(),
    raw: [...oa.records, ...ax.records],
    queries: oa.queries + ax.queries,
    failed: oa.failed + ax.failed,
  };
  await writeDevRaw(payload);
  return payload;
}

/** Journal version wins over the preprint; otherwise the better-scoring one. */
function preferred(a: ScannedPaper, b: ScannedPaper): ScannedPaper {
  if (a.source !== b.source) return a.source === "openalex" ? a : b;
  return b.score > a.score ? b : a;
}

export async function runScan(): Promise<ScanResult> {
  const { raw, queries, failed } = await retrieve();

  let offTopic = 0;
  let thin = 0;
  let binnedCount = 0;
  const scored: ScannedPaper[] = [];

  for (const rec of raw) {
    const m = matchRules(rec);
    if (m.topics.length === 0) {
      offTopic++;
      continue;
    }
    // The bar. See MIN_SOLID_TOPICS in data/horizon-scan.ts: one subject the
    // paper is actually about, or two it at least touches.
    if (m.solid.length < MIN_SOLID_TOPICS && m.topics.length < MIN_WEAK_TOPICS) {
      thin++;
      continue;
    }
    if (binned(rec)) {
      binnedCount++;
      continue;
    }
    const interest = readInterest(rec.title, rec.abstract);
    scored.push({
      ...rec,
      topics: m.topics,
      solidTopics: m.solid,
      clusters: m.clusters,
      strongClusters: m.strong,
      primaryCluster: m.strong[0] ?? m.clusters[0],
      convergent: m.strong.length >= 2,
      hits: m.hits.slice(0, 6),
      standing: null, // filled by the authority pass below
      spark: interest.spark,
      claims: interest.claims,
      drags: interest.drags,
      keySentence: interest.keySentence,
      score: score(rec, m, interest.spark),
    });
  }

  // Two passes, same as the myxo feed: exact DOI first, then title plus first
  // author, which is what catches a preprint and its journal version.
  const byDoi = new Map<string, ScannedPaper>();
  for (const p of scored) {
    const key = normDoi(p.doi) ?? p.id;
    const existing = byDoi.get(key);
    byDoi.set(key, existing ? preferred(existing, p) : p);
  }
  const byTitle = new Map<string, ScannedPaper>();
  for (const p of byDoi.values()) {
    const key = titleKey(p);
    const existing = byTitle.get(key);
    byTitle.set(key, existing ? preferred(existing, p) : p);
  }

  const deduped = Array.from(byTitle.values());

  // Authority last, on the deduped set only: one lookup per distinct venue,
  // author and institution rather than one per retrieved row. Missing standing
  // adds nothing rather than subtracting, so an arXiv preprint, which carries
  // no ids at all, is ranked on the rules and is not pushed down for it.
  const standing = await fetchStanding(deduped).catch(() => new Map());
  for (const p of deduped) {
    const st = standing.get(p.id);
    if (!st) continue;
    p.standing = st;
    p.score = Math.round((p.score + st.score * AUTHORITY_WEIGHT) * 10) / 10;
  }

  const ranked = deduped.sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));

  // The per-subject cap. Quantum has the most distinctive vocabulary of the
  // nine so it matches hardest, and unchecked it took a third of the page,
  // which made the whole thing read as a quantum feed. Over-cap papers are
  // pushed behind the rest rather than dropped: nothing is hidden, the page
  // just does not open with sixteen of the same subject.
  const perSubject = new Map<ClusterId, number>();
  const front: ScannedPaper[] = [];
  const back: ScannedPaper[] = [];
  for (const p of ranked) {
    const n = (perSubject.get(p.primaryCluster) ?? 0) + 1;
    perSubject.set(p.primaryCluster, n);
    (n <= MAX_PER_SUBJECT ? front : back).push(p);
  }
  const papers = [...front, ...back].slice(0, MAX_HELD);

  // Pictures last, and only for the handful that will actually show one. The
  // digest picks its ten under the same per-subject cap the board uses, so this
  // fetches exactly the set that gets rendered rather than the whole page.
  const digestPerSubject = new Map<ClusterId, number>();
  const digest: ScannedPaper[] = [];
  for (const p of papers) {
    if (digest.length >= TOP_PICKS) break;
    const n = (digestPerSubject.get(p.primaryCluster) ?? 0) + 1;
    if (n > DIGEST_PER_SUBJECT) continue;
    digestPerSubject.set(p.primaryCluster, n);
    digest.push(p);
  }
  await attachFigures(digest).catch(() => {});

  return {
    papers,
    ranAt: new Date().toISOString(),
    stats: {
      queries,
      retrieved: raw.length,
      duplicates: scored.length - byTitle.size,
      kept: ranked.length,
      shown: papers.length,
      offTopic,
      thin,
      binned: binnedCount,
      convergent: papers.filter((p) => p.convergent).length,
      withStanding: papers.filter((p) => p.standing !== null).length,
      capped: back.length,
      withFigure: papers.filter((p) => p.figure).length,
      failed,
    },
  };
}
