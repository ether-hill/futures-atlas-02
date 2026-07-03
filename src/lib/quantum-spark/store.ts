/**
 * Quantum Spark — spark archive. Once a business's five insights are
 * generated they're stored and served on subsequent requests instead of
 * re-running the model ("Spark 5 more" passes fresh:true to bypass and
 * overwrite, so live-audience regeneration still produces a new set).
 *
 * Keys carry prompt version + model so prompt edits invalidate naturally.
 * Same dual-backend pattern as the rest of the site; no-ops without KV.
 * (Owner-approved deviation from the brief's no-persistence guardrail —
 * mirrors the Signal Reactor deck archive.)
 */

import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";
import type { SparkResult } from "./schema";

const TTL_S = 60 * 60 * 24 * 30; // 30 days

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

export function sparkKey(business: string, promptVersion: string, modelId: string): string {
  const slug = business
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `qs:spark:v${promptVersion}:${modelId}:${slug}`;
}

export async function readSpark(key: string): Promise<SparkResult | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.get(key);
    if (!raw) return null;
    const r = typeof raw === "string" ? (JSON.parse(raw) as SparkResult) : (raw as SparkResult);
    return Array.isArray(r.insights) && r.insights.length ? r : null;
  } catch {
    return null;
  }
}

export async function writeSpark(key: string, result: SparkResult): Promise<void> {
  const st = store();
  if (!st) return;
  try {
    await st.set(key, JSON.stringify(result), TTL_S);
  } catch {
    // archival is best-effort
  }
}
