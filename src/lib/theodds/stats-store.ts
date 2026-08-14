/**
 * The Odds — play tallies. Same dual-backend pattern as feed/poll-store.ts
 * (Upstash REST or REDIS_URL via ioredis), same graceful degradation: with no
 * store provisioned, reads return null and the stats page says so instead of
 * inventing a number nobody produced.
 *
 * One hash, two fields: `plays` (every resolved roll/spin/pick) and `doom`
 * (the subset that ended in doom). Counts only — nothing about who played.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

interface S {
  hgetall(key: string): Promise<Record<string, string>>;
  hincrby(key: string, field: string, by: number): Promise<void>;
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
      hgetall: async (k) => (await r.hgetall<Record<string, string>>(k)) ?? {},
      hincrby: async (k, f, by) => {
        await r.hincrby(k, f, by);
      },
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      hgetall: async (k) => ((await r.hgetall(k)) as Record<string, string>) ?? {},
      hincrby: async (k, f, by) => {
        await r.hincrby(k, f, by);
      },
    };
  } else s = null;

  return s;
}

const KEY = "fa:theodds:stats";

export const statsConfigured = () => store() !== null;

export interface Tally {
  plays: number;
  doom: number;
}

export async function readStats(): Promise<Tally | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.hgetall(KEY);
    return { plays: Number(raw.plays) || 0, doom: Number(raw.doom) || 0 };
  } catch {
    return null;
  }
}

export async function recordOutcome(isDoom: boolean): Promise<boolean> {
  const st = store();
  if (!st) return false;
  try {
    await st.hincrby(KEY, "plays", 1);
    if (isDoom) await st.hincrby(KEY, "doom", 1);
    return true;
  } catch {
    return false;
  }
}
