/**
 * Swipe the Future, simple metrics store. Atomic HINCRBY counters: global
 * tallies plus per-card and per-category splits. Reuses the same KV
 * provisioning as the token store; no-ops if KV is absent. Node-only.
 *
 * TWO HASHES, ON PURPOSE.
 *
 * v1 asked "is this claim true?" on a four-step scale and stored believe/doubt
 * under `fa:swipe`. v2 asks "has this already happened?", a different question
 * with a different key, so its answers land in `fa:swipe:v2` under different
 * field names. Pooling them would produce an average of two questions, which is
 * not a number that means anything. v1 is still playable at /swipe-v1 and still
 * writes to its own hash.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const HKEY_V1 = "fa:swipe";
const HKEY_V2 = "fa:swipe:v2";
const restUrl = process.env.KV_REST_API_URL;
const restToken = process.env.KV_REST_API_TOKEN;
const redisUrl = process.env.REDIS_URL;

interface S {
  bump(key: string, fields: string[]): Promise<void>;
  hgetall(key: string): Promise<Record<string, string>>;
}
let s: S | null | undefined;

function get(): S | null {
  if (s !== undefined) return s;
  if (restUrl && restToken) {
    const r = new UpstashRedis({ url: restUrl, token: restToken });
    s = {
      bump: async (key, fields) => { await Promise.all(fields.map((f) => r.hincrby(key, f, 1))); },
      hgetall: async (key) => (await r.hgetall<Record<string, string>>(key)) ?? {},
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      bump: async (key, fields) => { const p = r.pipeline(); fields.forEach((f) => p.hincrby(key, f, 1)); await p.exec(); },
      hgetall: async (key) => ((await r.hgetall(key)) as Record<string, string>) ?? {},
    };
  } else s = null;
  return s;
}

export function statsConfigured(): boolean { return get() !== null; }

/** v1's four-step scale. Still live at /swipe-v1, so still accepted here. */
export type VerdictV1 = "unlikely" | "contested" | "likely" | "already";
/** v2's binary key. */
export type VerdictV2 = "notyet" | "already";

export const VERDICTS_V1: VerdictV1[] = ["unlikely", "contested", "likely", "already"];
export const VERDICTS_V2: VerdictV2[] = ["notyet", "already"];

function alignedV1(v: VerdictV1, believe: boolean): boolean {
  if (v === "contested") return true;
  if (v === "unlikely") return !believe;
  return believe;
}

/** v1: "is this true?" Believe/doubt, contested claims unscorable. */
export async function trackAnswerV1(a: { cardId: string; category: string; verdict: VerdictV1; believe: boolean }): Promise<void> {
  const st = get(); if (!st) return;
  const side = a.believe ? "b" : "d";
  const fields = ["swipes", a.believe ? "believe" : "doubt", `c:${a.cardId}:${side}`, `cat:${a.category}:${side}`];
  if (a.verdict === "contested") fields.push("contested");
  else { fields.push("scored"); if (alignedV1(a.verdict, a.believe)) fields.push("aligned"); }
  try { await st.bump(HKEY_V1, fields); } catch { /* best-effort */ }
}

/** v2: "has this already happened?" Every card is scorable, so there is no
 *  separate `scored` counter: it equals `swipes`. */
export async function trackAnswerV2(a: { cardId: string; category: string; verdict: VerdictV2; real: boolean }): Promise<void> {
  const st = get(); if (!st) return;
  const side = a.real ? "r" : "n";
  const fields = ["swipes", a.real ? "real" : "notyet", `c:${a.cardId}:${side}`, `cat:${a.category}:${side}`];
  if (a.real === (a.verdict === "already")) fields.push("aligned");
  try { await st.bump(HKEY_V2, fields); } catch { /* best-effort */ }
}

export async function trackRound(version: 1 | 2): Promise<void> {
  const st = get(); if (!st) return;
  try { await st.bump(version === 2 ? HKEY_V2 : HKEY_V1, ["rounds"]); } catch { /* */ }
}

export async function readStats(version: 1 | 2): Promise<Record<string, string>> {
  const st = get(); if (!st) return {};
  try { return await st.hgetall(version === 2 ? HKEY_V2 : HKEY_V1); } catch { return {}; }
}
