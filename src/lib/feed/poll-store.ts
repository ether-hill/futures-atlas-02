/**
 * Poll tallies. Same dual-backend pattern as the rest of the site (Upstash
 * REST or REDIS_URL via ioredis), and the same graceful degradation: with no
 * store provisioned the reads return null and the card tells the reader that
 * answers are not being recorded, rather than inventing a result.
 *
 * One hash per poll, one field per option. Counts only — nothing about who
 * answered is stored, and nothing needs to be.
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

const key = (pollId: string) => `fa:poll:${pollId}`;

export const pollsConfigured = () => store() !== null;

/** Counts per option id. null means "no store" — never an empty tally. */
export async function readTally(pollId: string): Promise<Record<string, number> | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.hgetall(key(pollId));
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      const n = Number(v);
      if (Number.isFinite(n)) out[k] = n;
    }
    return out;
  } catch {
    return null;
  }
}

export async function castVote(pollId: string, optionId: string): Promise<boolean> {
  const st = store();
  if (!st) return false;
  try {
    await st.hincrby(key(pollId), optionId, 1);
    return true;
  } catch {
    return false;
  }
}
