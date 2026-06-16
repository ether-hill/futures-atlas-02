/**
 * Server-side token-override store, shared across all visitors.
 *
 * Uses Vercel KV (Upstash Redis) via the standard KV_REST_API_* env vars. If
 * those aren't configured yet, every call degrades gracefully (reads return {},
 * writes report not-configured) so the site still renders the tokens.css
 * defaults. Connect KV on the Frond Studio team and it persists for everyone.
 */
import { Redis } from "@upstash/redis";

const url = process.env.KV_REST_API_URL;
const token = process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const KEY = "fa:tokens";

export function storeConfigured(): boolean {
  return redis !== null;
}

export async function readOverrides(): Promise<Record<string, string>> {
  if (!redis) return {};
  try {
    const h = await redis.hgetall<Record<string, string>>(KEY);
    return h ?? {};
  } catch {
    return {};
  }
}

export async function writeOverride(id: string, value: string): Promise<boolean> {
  if (!redis) return false;
  await redis.hset(KEY, { [id]: value });
  return true;
}

export async function deleteOverride(id: string): Promise<boolean> {
  if (!redis) return false;
  await redis.hdel(KEY, id);
  return true;
}

export async function resetAllOverrides(): Promise<boolean> {
  if (!redis) return false;
  await redis.del(KEY);
  return true;
}
