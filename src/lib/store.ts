/**
 * Server-side token-override store, shared across all visitors.
 *
 * Supports either provisioning the Vercel KV / Upstash integration gives you:
 *   - REST API  (KV_REST_API_URL + KV_REST_API_TOKEN)  -> @upstash/redis
 *   - connection string (REDIS_URL)                    -> ioredis
 * Degrades gracefully if neither is set (reads return {}, writes report false)
 * so the site still renders the tokens.css defaults.
 *
 * Used only in Node contexts (the /api/tokens route + the layout), never edge.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const KEY = "fa:tokens";

const restUrl = process.env.KV_REST_API_URL;
const restToken = process.env.KV_REST_API_TOKEN;
const redisUrl = process.env.REDIS_URL;

interface Store {
  hgetall(): Promise<Record<string, string>>;
  hset(id: string, value: string): Promise<void>;
  hdel(id: string): Promise<void>;
  del(): Promise<void>;
}

let store: Store | null | undefined;

function getStore(): Store | null {
  if (store !== undefined) return store;

  if (restUrl && restToken) {
    const r = new UpstashRedis({ url: restUrl, token: restToken });
    store = {
      hgetall: async () => (await r.hgetall<Record<string, string>>(KEY)) ?? {},
      hset: async (id, v) => void (await r.hset(KEY, { [id]: v })),
      hdel: async (id) => void (await r.hdel(KEY, id)),
      del: async () => void (await r.del(KEY)),
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    store = {
      hgetall: async () => ((await r.hgetall(KEY)) as Record<string, string>) ?? {},
      hset: async (id, v) => void (await r.hset(KEY, id, v)),
      hdel: async (id) => void (await r.hdel(KEY, id)),
      del: async () => void (await r.del(KEY)),
    };
  } else {
    store = null;
  }
  return store;
}

export function storeConfigured(): boolean {
  return getStore() !== null;
}

export async function readOverrides(): Promise<Record<string, string>> {
  const s = getStore();
  if (!s) return {};
  try {
    return await s.hgetall();
  } catch {
    return {};
  }
}

export async function writeOverride(id: string, value: string): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.hset(id, value);
  return true;
}

export async function deleteOverride(id: string): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.hdel(id);
  return true;
}

export async function resetAllOverrides(): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.del();
  return true;
}
