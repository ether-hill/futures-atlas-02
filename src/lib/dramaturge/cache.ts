import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * A page read is metered — 500 a day without a key — so every fetch that costs
 * budget is written to disk and never paid for twice. A second run of the same
 * theme over the same books is a pure cache hit, which is an acceptance
 * criterion, not an optimisation.
 */
/**
 * Page reads are metered, so every metered fetch is written to disk and never
 * paid for twice. This is an AUTHORING cache: harvesting happens on a
 * developer's machine, never in a request, because a full harvest takes
 * minutes and no serverless function will wait that long.
 *
 * On a read-only filesystem it degrades to a pass-through — the fetch still
 * works, it is simply not remembered.
 */
const ROOT = path.join(process.cwd(), "data", "cache");
let writable = true;

let hits = 0;
let misses = 0;

export function cacheStats() {
  return { hits, misses };
}

export function resetCacheStats() {
  hits = 0;
  misses = 0;
}

function keyToPath(key: string): string {
  const hash = createHash("sha1").update(key).digest("hex");
  return path.join(ROOT, hash.slice(0, 2), `${hash}.json`);
}

export async function cached<T>(key: string, load: () => Promise<T>): Promise<T> {
  const file = keyToPath(key);
  try {
    const raw = await fs.readFile(file, "utf8");
    hits++;
    return JSON.parse(raw).value as T;
  } catch {
    // not cached yet
  }
  const value = await load();
  misses++;
  if (writable) {
    try {
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, JSON.stringify({ key, at: new Date().toISOString(), value }));
    } catch {
      writable = false; // read-only filesystem: keep fetching, stop remembering
    }
  }
  return value;
}

/** True when the key is already on disk — used to report budget before spending it. */
export async function isCached(key: string): Promise<boolean> {
  try {
    await fs.access(keyToPath(key));
    return true;
  } catch {
    return false;
  }
}
