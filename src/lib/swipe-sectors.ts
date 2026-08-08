/**
 * Swipe the Future — visitor-added sector decks.
 *
 * When someone types a sector the hand-checked set doesn't cover, Claude drafts
 * a deck for it (see api/swipe/sector) and it lands here. Decks are stored under
 * `fa:swipe:sec:<slug>` and indexed in the set `fa:swipe:secs`, so the picker can
 * list them without scanning keys.
 *
 * A generated deck is public immediately but carries `approved: false` and an
 * "AI-drafted" badge until an editor signs it off at /admin/swipe. Nothing here
 * ever touches the hand-written decks in the sub-app's data/sectors.ts.
 *
 * Same dual-backend pattern as the rest of the site (Upstash REST or REDIS_URL);
 * no-ops gracefully when no store is provisioned. Node-only.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const KEY = (slug: string) => `fa:swipe:sec:${slug}`;
const INDEX = "fa:swipe:secs";
/** Freshness reports written by the weekly re-check cron. */
export const RECHECK_KEY = "fa:swipe:recheck";

export type Verdict = "unlikely" | "contested" | "likely" | "already";

export interface GenCard {
  id: string;
  claim: string;
  verdict: Verdict;
  note: string;
  source: { label: string; url?: string };
  checked?: string;
}

export interface GenSector {
  id: string;
  kind: "generated";
  name: string;
  blurb: string;
  cards: GenCard[];
  approved: boolean;
  createdAt: string;
  requestedAs?: string; // what the visitor actually typed
}

interface S {
  get(key: string): Promise<unknown>;
  set(key: string, val: string): Promise<void>;
  del(key: string): Promise<void>;
  sadd(key: string, member: string): Promise<void>;
  srem(key: string, member: string): Promise<void>;
  smembers(key: string): Promise<string[]>;
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
      set: async (k, v) => { await r.set(k, v); },
      del: async (k) => { await r.del(k); },
      sadd: async (k, m) => { await r.sadd(k, m); },
      srem: async (k, m) => { await r.srem(k, m); },
      smembers: (k) => r.smembers(k),
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      get: (k) => r.get(k),
      set: async (k, v) => { await r.set(k, v); },
      del: async (k) => { await r.del(k); },
      sadd: async (k, m) => { await r.sadd(k, m); },
      srem: async (k, m) => { await r.srem(k, m); },
      smembers: (k) => r.smembers(k),
    };
  } else s = null;
  return s;
}

export function sectorsConfigured(): boolean { return store() !== null; }

/** URL/Redis-safe id for a typed sector name. Also the dedupe key. */
export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function parse(raw: unknown): GenSector | null {
  try {
    const v = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (v && typeof v === "object" && Array.isArray((v as GenSector).cards) && (v as GenSector).cards.length) return v as GenSector;
  } catch { /* corrupt entry — treat as missing */ }
  return null;
}

export async function readSector(slug: string): Promise<GenSector | null> {
  const st = store(); if (!st) return null;
  try { return parse(await st.get(KEY(slug))); } catch { return null; }
}

export async function listSectors(): Promise<GenSector[]> {
  const st = store(); if (!st) return [];
  try {
    const slugs = await st.smembers(INDEX);
    if (!slugs.length) return [];
    const all = await Promise.all(slugs.map((sl) => st.get(KEY(sl)).then(parse).catch(() => null)));
    return all.filter((x): x is GenSector => x !== null)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  } catch { return []; }
}

export async function writeSector(sec: GenSector): Promise<void> {
  const st = store(); if (!st) return;
  await st.set(KEY(sec.id), JSON.stringify(sec));
  await st.sadd(INDEX, sec.id);
}

export async function setApproved(slug: string, approved: boolean): Promise<GenSector | null> {
  const sec = await readSector(slug);
  if (!sec) return null;
  const next = { ...sec, approved };
  await writeSector(next);
  return next;
}

export async function deleteSector(slug: string): Promise<void> {
  const st = store(); if (!st) return;
  await st.del(KEY(slug));
  await st.srem(INDEX, slug);
}

/** Generic JSON slot — used for the weekly freshness report. */
export async function readJson<T>(key: string): Promise<T | null> {
  const st = store(); if (!st) return null;
  try {
    const raw = await st.get(key);
    if (!raw) return null;
    return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
  } catch { return null; }
}

export async function writeJson(key: string, value: unknown): Promise<void> {
  const st = store(); if (!st) return;
  await st.set(key, JSON.stringify(value));
}
