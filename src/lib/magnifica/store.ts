/**
 * Magnifica, translation cache. Read-aloud in a non-English language first
 * translates the passage with Claude Haiku; the result is cached here so the
 * same passage never pays for translation twice. Same dual-backend pattern as
 * the rest of the site (Upstash REST or REDIS_URL via ioredis); no-ops
 * gracefully when no store is provisioned.
 */

import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const TTL_S = 60 * 60 * 24 * 90; // translations are stable; 90 days

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

/** Stable cache key for a (text, language) pair. */
export function translationKey(text: string, lang: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `magnifica:tr:${lang}:${text.length}:${h.toString(36)}`;
}

export async function readTranslation(key: string): Promise<string | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.get(key);
    return typeof raw === "string" && raw.length > 0 ? raw : null;
  } catch {
    return null;
  }
}

export async function writeTranslation(key: string, text: string): Promise<void> {
  const st = store();
  if (!st) return;
  try {
    await st.set(key, text, TTL_S);
  } catch {
    // cache is best-effort
  }
}
