/**
 * Server-side token store, shared across all visitors.
 *   fa:tokens   — the active overrides (hash: token id -> value)
 *   fa:versions — saved design snapshots (hash: id -> JSON{label,ts,overrides})
 *
 * Supports either KV provisioning: REST (KV_REST_API_URL/TOKEN -> @upstash/redis)
 * or a connection string (REDIS_URL -> ioredis). Degrades gracefully if neither
 * is set. Node-only (the /api/tokens route + the layout); never edge.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

const KEY = "fa:tokens";
const VKEY = "fa:versions";

const restUrl = process.env.KV_REST_API_URL;
const restToken = process.env.KV_REST_API_TOKEN;
const redisUrl = process.env.REDIS_URL;

interface Store {
  hgetall(key: string): Promise<Record<string, string>>;
  hset(key: string, field: string, value: string): Promise<void>;
  hsetMany(key: string, map: Record<string, string>): Promise<void>;
  hdel(key: string, field: string): Promise<void>;
  del(key: string): Promise<void>;
}

let store: Store | null | undefined;

function getStore(): Store | null {
  if (store !== undefined) return store;
  if (restUrl && restToken) {
    const r = new UpstashRedis({ url: restUrl, token: restToken });
    store = {
      hgetall: async (k) => (await r.hgetall<Record<string, string>>(k)) ?? {},
      hset: async (k, f, v) => void (await r.hset(k, { [f]: v })),
      hsetMany: async (k, m) => void (await r.hset(k, m)),
      hdel: async (k, f) => void (await r.hdel(k, f)),
      del: async (k) => void (await r.del(k)),
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    store = {
      hgetall: async (k) => ((await r.hgetall(k)) as Record<string, string>) ?? {},
      hset: async (k, f, v) => void (await r.hset(k, f, v)),
      hsetMany: async (k, m) => void (await r.hset(k, m)),
      hdel: async (k, f) => void (await r.hdel(k, f)),
      del: async (k) => void (await r.del(k)),
    };
  } else {
    store = null;
  }
  return store;
}

export function storeConfigured(): boolean {
  return getStore() !== null;
}

// ---- active overrides ----

export async function readOverrides(): Promise<Record<string, string>> {
  const s = getStore();
  if (!s) return {};
  try {
    return await s.hgetall(KEY);
  } catch {
    return {};
  }
}

export async function writeOverride(id: string, value: string): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.hset(KEY, id, value);
  return true;
}

export async function deleteOverride(id: string): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.hdel(KEY, id);
  return true;
}

export async function resetAllOverrides(): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.del(KEY);
  return true;
}

/** Atomically replace the whole override set (used by undo/redo/restore). */
export async function replaceOverrides(map: Record<string, string>): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.del(KEY);
  if (Object.keys(map).length) await s.hsetMany(KEY, map);
  return true;
}

// ---- versions (saved snapshots) ----

export interface VersionMeta {
  id: string;
  label: string;
  ts: number;
}

export async function listVersions(): Promise<VersionMeta[]> {
  const s = getStore();
  if (!s) return [];
  try {
    const raw = await s.hgetall(VKEY);
    return Object.entries(raw)
      .map(([id, json]) => {
        try {
          const v = typeof json === "string" ? JSON.parse(json) : (json as { label: string; ts: number });
          return { id, label: v.label, ts: v.ts };
        } catch {
          return null;
        }
      })
      .filter((v): v is VersionMeta => v !== null)
      .sort((a, b) => b.ts - a.ts);
  } catch {
    return [];
  }
}

export async function saveVersion(label: string, overrides: Record<string, string>): Promise<VersionMeta | null> {
  const s = getStore();
  if (!s) return null;
  const ts = Date.now();
  const id = String(ts);
  await s.hset(VKEY, id, JSON.stringify({ label: label || "Untitled", ts, overrides }));
  return { id, label: label || "Untitled", ts };
}

export async function getVersionOverrides(id: string): Promise<Record<string, string> | null> {
  const s = getStore();
  if (!s) return null;
  const raw = await s.hgetall(VKEY);
  const json = raw[id];
  if (!json) return null;
  try {
    const v = typeof json === "string" ? JSON.parse(json) : (json as { overrides: Record<string, string> });
    return v.overrides ?? {};
  } catch {
    return null;
  }
}

export async function deleteVersion(id: string): Promise<boolean> {
  const s = getStore();
  if (!s) return false;
  await s.hdel(VKEY, id);
  return true;
}
