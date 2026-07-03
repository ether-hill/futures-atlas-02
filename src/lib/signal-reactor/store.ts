/**
 * Signal Reactor — deck archive. Once a sector's briefing is generated it's
 * stored here and served on subsequent requests instead of re-running the
 * model pipeline (instant, free, and shared links reopen the same deck).
 *
 * Keys carry the prompt version, mode and model, so editing the prompts (or
 * switching model/mode) naturally invalidates the archive. Same dual-backend
 * pattern as the rest of the site (Upstash REST or REDIS_URL via ioredis);
 * no-ops gracefully when no store is provisioned.
 */

import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import type { Deck } from "./deck";

/** Archived decks live this long; a fresh=true generation overwrites early. */
const DECK_TTL_S = 60 * 60 * 24 * 30; // 30 days

interface S {
  get(key: string): Promise<unknown>;
  set(key: string, val: string, ttlS: number): Promise<void>;
}
let s: S | null | undefined;

function store(): S | null {
  if (s !== undefined) return s;
  const restUrl = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  const redisUrl = process.env.REDIS_URL;
  if (restUrl && restToken) {
    const r = new UpstashRedis({ url: restUrl, token: restToken });
    s = {
      get: (k) => r.get(k),
      set: async (k, v, ttl) => {
        await r.set(k, v, { ex: ttl });
      },
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      get: (k) => r.get(k),
      set: async (k, v, ttl) => {
        await r.set(k, v, "EX", ttl);
      },
    };
  } else s = null;
  return s;
}

/** Normalised archive key for a sector request. */
export function deckKey(sector: string, promptVersion: string, mode: string, modelId: string): string {
  const slug = sector
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `sr:deck:v${promptVersion}:${mode}:${modelId}:${slug}`;
}

export async function readDeck(key: string): Promise<Deck | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.get(key);
    if (!raw) return null;
    // upstash auto-deserialises JSON strings; ioredis returns the string
    const deck = typeof raw === "string" ? (JSON.parse(raw) as Deck) : (raw as Deck);
    return Array.isArray(deck.slides) && deck.slides.length ? deck : null;
  } catch {
    return null;
  }
}

export async function writeDeck(key: string, deck: Deck): Promise<void> {
  const st = store();
  if (!st) return;
  try {
    await st.set(key, JSON.stringify(deck), DECK_TTL_S);
  } catch {
    // archival is best-effort; generation already succeeded
  }
}
