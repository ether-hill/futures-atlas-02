/**
 * Swipe the Future — simple metrics store (one Redis hash, fa:swipe).
 * Atomic HINCRBY counters: global tallies + per-card and per-category believe/doubt.
 * Reuses the same KV provisioning as the token store; no-ops if KV is absent.
 * Node-only.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const HKEY = "fa:swipe";
const restUrl = process.env.KV_REST_API_URL;
const restToken = process.env.KV_REST_API_TOKEN;
const redisUrl = process.env.REDIS_URL;

interface S {
  bump(fields: string[]): Promise<void>;
  hgetall(): Promise<Record<string, string>>;
}
let s: S | null | undefined;

function get(): S | null {
  if (s !== undefined) return s;
  if (restUrl && restToken) {
    const r = new UpstashRedis({ url: restUrl, token: restToken });
    s = {
      bump: async (fields) => { await Promise.all(fields.map((f) => r.hincrby(HKEY, f, 1))); },
      hgetall: async () => (await r.hgetall<Record<string, string>>(HKEY)) ?? {},
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      bump: async (fields) => { const p = r.pipeline(); fields.forEach((f) => p.hincrby(HKEY, f, 1)); await p.exec(); },
      hgetall: async () => ((await r.hgetall(HKEY)) as Record<string, string>) ?? {},
    };
  } else s = null;
  return s;
}

export function statsConfigured(): boolean { return get() !== null; }

export type Verdict = "unlikely" | "contested" | "likely" | "already";
function isAligned(v: Verdict, believe: boolean): boolean {
  if (v === "contested") return true;
  if (v === "unlikely") return !believe;
  return believe;
}

export async function trackAnswer(a: { cardId: string; category: string; verdict: Verdict; believe: boolean }): Promise<void> {
  const st = get(); if (!st) return;
  const side = a.believe ? "b" : "d";
  const fields = ["swipes", a.believe ? "believe" : "doubt", `c:${a.cardId}:${side}`, `cat:${a.category}:${side}`];
  if (a.verdict === "contested") fields.push("contested");
  else { fields.push("scored"); if (isAligned(a.verdict, a.believe)) fields.push("aligned"); }
  try { await st.bump(fields); } catch { /* best-effort */ }
}

export async function trackRound(): Promise<void> {
  const st = get(); if (!st) return;
  try { await st.bump(["rounds"]); } catch { /* */ }
}

export async function readStats(): Promise<Record<string, string>> {
  const st = get(); if (!st) return {};
  try { return await st.hgetall(); } catch { return {}; }
}
