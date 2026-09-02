/**
 * The scan's own cache, because the framework's does not survive this app.
 *
 * The root layout is `force-dynamic` so the KV design-token overrides are read
 * on every request. In Next 15 that also defaults every fetch beneath it to
 * no-store, and it does so even for fetches that set their own
 * `next: { revalidate }`; `fetchCache = "default-cache"` on this segment does
 * not win it back. Measured on a production build: 35 seconds a render, and all
 * 22 OpenAlex calls firing on every page view. At 10 credits each that is 220
 * of a 1000-a-day allowance PER VIEW, so two people opening the page would take
 * the whole day's budget.
 *
 * So the run is cached here instead, in two layers:
 *
 *   1. the KV store the project already runs (`REDIS_URL`), shared by every
 *      instance, which is what actually bounds the credit spend;
 *   2. a module-level memo, so repeat requests on a warm instance do not even
 *      pay the round trip.
 *
 * Plus single-flight: concurrent requests on a cold instance wait on one run
 * rather than each starting their own.
 *
 * If a refresh fails but a stored run exists, the stored one is served and the
 * page prints when it ran. That is not the same as passing off yesterday's
 * results as today's, which the page still never does: `ranAt` is on the page.
 */
import { REVALIDATE_SECONDS } from "@/data/horizon-scan";
import { readCached, writeCached } from "@/lib/store";
import { runScan } from "./collect";
import type { ScanResult } from "./types";

const CACHE_NAME = "horizon-scan";

/** How long a finished run is held in development. See getScan(). */
const DEV_MEMO_MS = 2_000;

let memo: ScanResult | null = null;
let inFlight: Promise<ScanResult | null> | null = null;

const ageSeconds = (iso: string): number => (Date.now() - new Date(iso).getTime()) / 1000;
const isFresh = (r: ScanResult): boolean => ageSeconds(r.ranAt) < REVALIDATE_SECONDS;

async function readStored(): Promise<ScanResult | null> {
  const raw = await readCached(CACHE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ScanResult;
    return parsed?.ranAt && Array.isArray(parsed.papers) ? parsed : null;
  } catch {
    return null;
  }
}

async function refresh(): Promise<ScanResult | null> {
  let fresh: ScanResult | null = null;
  try {
    fresh = await runScan();
  } catch {
    fresh = null;
  }
  if (fresh) {
    memo = fresh;
    await writeCached(CACHE_NAME, JSON.stringify(fresh));
    return fresh;
  }
  // A failed refresh falls back to whatever is stored, stale or not. The page
  // shows `ranAt`, so an old run reads as an old run.
  return memo ?? (await readStored());
}

export async function getScan(): Promise<ScanResult | null> {
  // In development the finished result is held for seconds rather than a day.
  // Long enough that one page render's passes share a single scan, short enough
  // that editing a rule and reloading shows the change. The expensive half is
  // retrieval and that has its own disk cache inside runScan(), so recomputing
  // costs milliseconds.
  //
  // Both halves of that matter. Caching for a day meant an edit changed nothing
  // on screen until the server was restarted. Not caching at all meant the two
  // render passes each ran their own scan, and since scoring reads Date.now()
  // for recency and `ranAt` is stamped per run, the two passes disagreed and
  // React reported a hydration mismatch (blamed, confusingly, on the Footer,
  // which is simply where its tree diff landed).
  if (process.env.NODE_ENV !== "production") {
    if (memo && Date.now() - new Date(memo.ranAt).getTime() < DEV_MEMO_MS) return memo;
    try {
      memo = await runScan();
      return memo;
    } catch {
      return null;
    }
  }

  if (memo && isFresh(memo)) return memo;

  const stored = await readStored();
  if (stored && isFresh(stored)) {
    memo = stored;
    return stored;
  }
  if (stored) memo = stored; // stale, but the fallback if the refresh fails

  if (!inFlight) {
    inFlight = refresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}
