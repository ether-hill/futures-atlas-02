/**
 * The Odds — play tallies. Same dual-backend pattern as feed/poll-store.ts
 * (Upstash REST or REDIS_URL via ioredis), same graceful degradation: with no
 * store provisioned, reads return null and the stats page says so instead of
 * inventing a number nobody produced.
 *
 * Counts only. Nothing identifying is stored — not an IP, not a user agent.
 *
 * TWO tallies, because they answer different questions:
 *
 *   • Per PLAY (`plays`, `doom`, and the same pair per thinker). This is the
 *     coin's own behaviour: over enough rolls it converges on the odds the
 *     thinker actually stated, which is the point of the piece.
 *   • Per PLAYER (`players`, `doomPlayers`, `untilDoom:N`). This is the
 *     behaviour of the person holding the die: how many of them kept going
 *     until it came up doom, and how many tries that took. A play is a
 *     probability. A player who re-rolls until the world ends is a choice.
 *
 * A "player" is one browser session (sessionStorage id, minted client-side and
 * used for nothing but this). Sessions expire from the store after a week; the
 * aggregate counters they fed do not.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

interface S {
  hgetall(key: string): Promise<Record<string, string>>;
  hincrby(key: string, field: string, by: number): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
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
      hincrby: (k, f, by) => r.hincrby(k, f, by),
      expire: (k, sec) => r.expire(k, sec),
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    s = {
      hgetall: async (k) => ((await r.hgetall(k)) as Record<string, string>) ?? {},
      hincrby: (k, f, by) => r.hincrby(k, f, by),
      expire: (k, sec) => r.expire(k, sec),
    };
  } else s = null;

  return s;
}

const KEY = "fa:theodds:stats";
const sessKey = (id: string) => `fa:theodds:s:${id}`;
const SESSION_TTL = 60 * 60 * 24 * 7; // a week

/** The three rituals. Anything else a client sends is dropped. */
export const THINKERS = ["dario-amodei", "elon-musk", "max-tegmark"] as const;
export type Thinker = (typeof THINKERS)[number];
export const isThinker = (v: unknown): v is Thinker =>
  typeof v === "string" && (THINKERS as readonly string[]).includes(v);

/**
 * How many tries it took to reach doom, bucketed. Open-ended at the top so one
 * very stubborn session cannot stretch the axis for everybody.
 */
export const UNTIL_BUCKETS = ["1", "2", "3", "4", "5", "6-10", "11+"] as const;
export type UntilBucket = (typeof UNTIL_BUCKETS)[number];
function bucketOf(n: number): UntilBucket {
  if (n <= 5) return String(Math.max(1, n)) as UntilBucket;
  if (n <= 10) return "6-10";
  return "11+";
}

export interface Tally {
  /** every resolved roll, spin and pick */
  plays: number;
  /** the subset that came up doom */
  doom: number;
  /** distinct sessions that resolved at least one play */
  players: number;
  /** the subset of those that reached doom at least once */
  doomPlayers: number;
  /** sessions that walked away without ever seeing doom, having played more than once */
  rerolledAndLived: number;
  /** plays a session made AFTER it had already hit doom */
  playsAfterDoom: number;
  /** how many tries it took each doomed session, bucketed */
  untilDoom: Record<UntilBucket, number>;
  /** per-thinker plays / doom */
  byThinker: Record<Thinker, { plays: number; doom: number }>;
}

const n = (v: string | undefined) => Number(v) || 0;

export const statsConfigured = () => store() !== null;

export async function readStats(): Promise<Tally | null> {
  const st = store();
  if (!st) return null;
  try {
    const raw = await st.hgetall(KEY);
    return {
      plays: n(raw.plays),
      doom: n(raw.doom),
      players: n(raw.players),
      doomPlayers: n(raw.doomPlayers),
      rerolledAndLived: n(raw.rerolledAndLived),
      playsAfterDoom: n(raw.playsAfterDoom),
      untilDoom: Object.fromEntries(
        UNTIL_BUCKETS.map((b) => [b, n(raw[`until:${b}`])]),
      ) as Record<UntilBucket, number>,
      byThinker: Object.fromEntries(
        THINKERS.map((t) => [t, { plays: n(raw[`plays:${t}`]), doom: n(raw[`doom:${t}`]) }]),
      ) as Tally["byThinker"],
    };
  } catch {
    return null;
  }
}

/**
 * Record one resolved play.
 *
 * `session` is what makes the per-player numbers possible: the first play under
 * an id counts a player, the first doom under that id counts a doomed player
 * and files how many tries it took. Without an id the play still lands in the
 * per-play totals, it just cannot say anything about the person.
 */
export async function recordOutcome(
  isDoom: boolean,
  opts: { session?: string; thinker?: Thinker } = {},
): Promise<boolean> {
  const st = store();
  if (!st) return false;
  try {
    await st.hincrby(KEY, "plays", 1);
    if (isDoom) await st.hincrby(KEY, "doom", 1);
    if (opts.thinker) {
      await st.hincrby(KEY, `plays:${opts.thinker}`, 1);
      if (isDoom) await st.hincrby(KEY, `doom:${opts.thinker}`, 1);
    }

    if (opts.session) {
      const k = sessKey(opts.session);
      const nth = await st.hincrby(k, "n", 1);
      await st.expire(k, SESSION_TTL);
      if (nth === 1) await st.hincrby(KEY, "players", 1);

      // hincrby is the test as well as the write: it returns 1 only for the
      // session's FIRST doom, so the player is counted exactly once however
      // many more times they roll it afterwards.
      const doomsSoFar = isDoom ? await st.hincrby(k, "doom", 1) : n((await st.hgetall(k)).doom);
      if (isDoom && doomsSoFar === 1) {
        await st.hincrby(KEY, "doomPlayers", 1);
        await st.hincrby(KEY, `until:${bucketOf(nth)}`, 1);
        // They had been surviving up to now, so undo the "walked away alive"
        // credit their re-rolls had been earning.
        if (nth > 1) await st.hincrby(KEY, "rerolledAndLived", -1);
      } else if (!isDoom && doomsSoFar === 0 && nth === 2) {
        // Second play, still no doom: provisionally a player who kept going and
        // lived. Reversed above the moment doom lands.
        await st.hincrby(KEY, "rerolledAndLived", 1);
      } else if (doomsSoFar > 0) {
        await st.hincrby(KEY, "playsAfterDoom", 1);
      }
    }
    return true;
  } catch {
    return false;
  }
}
