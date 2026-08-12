/**
 * Feed side-panel state: the view counter and the sign-up list.
 *
 * Same dual-backend pattern and the same honesty rule as the polls — with no
 * store provisioned the reads return null, and the panel says the counter is
 * off rather than showing a number nobody generated.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

interface S {
  get(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
  sadd(key: string, member: string): Promise<number>;
  scard(key: string): Promise<number>;
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
      incr: (k) => r.incr(k),
      sadd: (k, m) => r.sadd(k, m),
      scard: (k) => r.scard(k),
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      get: (k) => r.get(k),
      incr: (k) => r.incr(k),
      sadd: (k, m) => r.sadd(k, m),
      scard: (k) => r.scard(k),
    };
  } else s = null;

  return s;
}

const VIEWS = "fa:feed:views";
const SUBS = "fa:feed:subs";

export const feedStoreConfigured = () => store() !== null;

export async function bumpViews(): Promise<number | null> {
  const st = store();
  if (!st) return null;
  try {
    return await st.incr(VIEWS);
  } catch {
    return null;
  }
}

export async function readViews(): Promise<number | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.get(VIEWS);
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return null;
  }
}

export async function subscriberCount(): Promise<number | null> {
  const st = store();
  if (!st) return null;
  try {
    return await st.scard(SUBS);
  } catch {
    return null;
  }
}

/**
 * A set, so the same address twice is one member and the count stays honest.
 * Nothing but the address is stored — no name, no IP, no timestamp.
 */
export async function addSubscriber(email: string): Promise<boolean> {
  const st = store();
  if (!st) return false;
  try {
    await st.sadd(SUBS, email.toLowerCase());
    return true;
  } catch {
    return false;
  }
}
