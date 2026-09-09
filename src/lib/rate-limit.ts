/**
 * Inbound rate limiting for the endpoints that cost money.
 *
 * Several routes here spend on someone else's meter: two Claude calls per
 * Signal Reactor deck, one per Quantum Spark, an ElevenLabs synthesis per
 * Magnifica line. They are public POSTs on a public site, and until this file
 * existed nothing stopped one caller from running them in a loop. Caching by
 * input does not help — a caller who varies the input, or passes `fresh`,
 * misses the archive every time.
 *
 * Two limits, both fixed-window INCR counters in the same Redis the swipe
 * stats use:
 *
 *   perIp    what one visitor may do. Sized for a person using the thing.
 *   budget   what EVERYONE may do, together, in a day. The backstop: it caps
 *            the worst day at a number you can look at without flinching,
 *            however many addresses the traffic comes from.
 *
 * Fails OPEN on a Redis error, on a Redis that is too slow to answer, on a
 * connection string it cannot even parse, and when Redis is not configured. A
 * limiter that takes the site down when the counter store hiccups is worse than
 * the spend it prevents, and these are demos that get shown live. Production
 * has REDIS_URL set, so the limits are real there; a developer's machine
 * without it is simply unlimited, which is what you want locally.
 *
 * The arithmetic here is covered by test/rate-limit.test.mjs, which runs it
 * against a real counter store rather than the fail-open path:
 * `node --test test/rate-limit.test.mjs`.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

interface Store {
  incr(key: string, ttlSec: number): Promise<number>;
}

let store: Store | null | undefined;

/**
 * How long we wait for a counter before deciding we do not have one.
 *
 * The dangerous store is not the one that is down, it is the one that accepts
 * the connection and then never answers: neither client sets a command timeout,
 * so without a deadline here the request sits in this function until the
 * platform kills it, on every call. That is a worse outage than the spend this
 * file exists to prevent. A healthy counter answers in single-digit
 * milliseconds; two counters per call, so this is the worst case twice.
 */
const STORE_TIMEOUT_MS = 1500;

function deadline<T>(work: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("rate-limit: counter store timed out")),
      STORE_TIMEOUT_MS,
    );
    work.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function get(): Store | null {
  if (store !== undefined) return store;
  const restUrl = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  const redisUrl = process.env.REDIS_URL;
  try {
    if (restUrl && restToken) {
      const r = new UpstashRedis({ url: restUrl, token: restToken });
      store = {
        incr: async (key, ttl) => {
          const n = await r.incr(key);
          if (n === 1) await r.expire(key, ttl);
          return n;
        },
      };
    } else if (redisUrl) {
      const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
      store = {
        incr: async (key, ttl) => {
          const n = await r.incr(key);
          if (n === 1) await r.expire(key, ttl);
          return n;
        },
      };
    } else store = null;
  } catch {
    // Both clients validate the connection string in their constructor, so a
    // typo in REDIS_URL throws here rather than at call time, outside the
    // try/catch below and straight into the route. A client we cannot build is
    // the same as no client: fail open, and remember that so we are not
    // rebuilding a broken one on every request.
    store = null;
  }
  return store;
}

/** The caller's address, as Vercel reports it. Everything behind one NAT shares
 *  a bucket, which is the usual and accepted cost of limiting by address. */
export function callerIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 45);
  return req.headers.get("x-real-ip")?.slice(0, 45) || "unknown";
}

export interface Verdict {
  ok: boolean;
  /** Seconds until the window that rejected this one rolls over. */
  retryAfter: number;
  /** Which limit said no, for the log line. */
  hit?: "ip" | "budget";
}

const OK: Verdict = { ok: true, retryAfter: 0 };

/**
 * One call against both windows. `name` scopes the counters, so each route
 * gets its own pair and a busy Signal Reactor never locks Quantum Spark.
 *
 * Windows are aligned to the clock (floor(now / window)) rather than tracked
 * per key, which keeps this to one INCR and one EXPIRE and needs no read.
 */
export async function rateLimit(
  req: Request,
  name: string,
  opts: { perIp: number; perIpWindowSec: number; budget: number; budgetWindowSec?: number },
): Promise<Verdict> {
  const st = get();
  if (!st) return OK;

  const budgetWindow = opts.budgetWindowSec ?? 86400;
  const now = Math.floor(Date.now() / 1000);
  const ipSlot = Math.floor(now / opts.perIpWindowSec);
  const budgetSlot = Math.floor(now / budgetWindow);

  try {
    const ip = callerIp(req);
    const n = await deadline(st.incr(`fa:rl:${name}:ip:${ip}:${ipSlot}`, opts.perIpWindowSec));
    if (n > opts.perIp) {
      return { ok: false, hit: "ip", retryAfter: (ipSlot + 1) * opts.perIpWindowSec - now };
    }
    const total = await deadline(st.incr(`fa:rl:${name}:all:${budgetSlot}`, budgetWindow));
    if (total > opts.budget) {
      return { ok: false, hit: "budget", retryAfter: (budgetSlot + 1) * budgetWindow - now };
    }
    return OK;
  } catch {
    // Counter store unreachable, erroring, or too slow to answer. Let the
    // request through rather than break a live demo over a Redis blip.
    return OK;
  }
}
