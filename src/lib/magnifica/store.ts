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

/* ------------------------------------------------------------------ speech */

/**
 * Generated speech is cached too. The same passage always produces the same
 * audio, so without this every play pays the generation wait again — around a
 * second and a half of silence after pressing Listen — and bills the
 * characters again. Cached, a repeat play is a single round trip.
 */

/** Anything larger than this is served but not stored; Redis is not a CDN. */
const MAX_CACHED_BYTES = 900_000;

export interface CachedSpeech {
  audio: string; // base64 mp3
  spoken: string;
  alignment: { chars: string[]; starts: number[]; ends: number[] } | null;
}

export function speechKey(text: string, lang: string, voice: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return `magnifica:tts:${lang}:${voice}:${text.length}:${h.toString(36)}`;
}

export async function readSpeech(key: string): Promise<CachedSpeech | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.get(key);
    // Upstash parses JSON on the way out; ioredis hands back a string.
    const val = typeof raw === "string" ? (JSON.parse(raw) as CachedSpeech) : (raw as CachedSpeech | null);
    return val && typeof val.audio === "string" && val.audio.length > 0 ? val : null;
  } catch {
    return null;
  }
}

export async function writeSpeech(key: string, val: CachedSpeech): Promise<void> {
  const st = store();
  if (!st) return;
  try {
    const body = JSON.stringify(val);
    if (body.length > MAX_CACHED_BYTES) return;
    await st.set(key, body, TTL_S);
  } catch {
    // cache is best-effort
  }
}
