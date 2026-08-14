/**
 * Actually Hard Questions — session store for the deployed (backend-less)
 * static bundle. Same dual-backend pattern as theodds/stats-store.ts (Upstash
 * REST or REDIS_URL via ioredis), same graceful degradation: with no store
 * provisioned, every call returns null/false and the API route answers
 * `configured:false` on /health, which the client already treats exactly
 * like "no server" (see index.html's netInit) — falling back to its
 * single-device localStorage mode rather than breaking.
 *
 * Mirrors the local dev server (server.mjs)'s session shape and API surface
 * exactly, so the same client code drives both: a session is one JSON blob
 * keyed by its 5-letter code, no separate question rows to keep in sync.
 * Sessions expire after 14 days (SESSION_TTL) — this is workshop scratch
 * data, not a permanent record.
 */
import Redis from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
}

let kv: KV | null | undefined;

function store(): KV | null {
  if (kv !== undefined) return kv;
  const restUrl = process.env.KV_REST_API_URL;
  const restToken = process.env.KV_REST_API_TOKEN;
  const redisUrl = process.env.REDIS_URL;

  if (restUrl && restToken) {
    const r = new UpstashRedis({ url: restUrl, token: restToken });
    kv = {
      get: async (k) => (await r.get<string>(k)) ?? null,
      set: async (k, v, ttl) => void (await r.set(k, v, { ex: ttl })),
      del: async (k) => void (await r.del(k)),
    };
  } else if (redisUrl) {
    const r = new Redis(redisUrl, { maxRetriesPerRequest: 3, lazyConnect: false });
    kv = {
      get: async (k) => await r.get(k),
      set: async (k, v, ttl) => void (await r.set(k, v, "EX", ttl)),
      del: async (k) => void (await r.del(k)),
    };
  } else kv = null;

  return kv;
}

export const storeConfigured = () => store() !== null;

const SESSION_TTL = 60 * 60 * 24 * 14; // 14 days
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I, O, 0, 1
const keyFor = (id: string) => `fa:ahq:session:${id}`;

export interface Question {
  id: string;
  t: string;
  q: string;
  who: string;
  adj: number;
  at: number;
}
export interface Session {
  id: string;
  name: string;
  created: number;
  topicIdx: number;
  v: number;
  qs: Question[];
}

export async function getSession(id: string): Promise<Session | null> {
  const st = store();
  if (!st) return null;
  const raw = await st.get(keyFor(id.toUpperCase()));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

async function put(session: Session): Promise<void> {
  const st = store();
  if (!st) return;
  await st.set(keyFor(session.id), JSON.stringify(session), SESSION_TTL);
}

export async function createSession(name: string): Promise<Session | null> {
  const st = store();
  if (!st) return null;
  let id = "";
  for (let tries = 0; tries < 20; tries++) {
    const candidate = Array.from({ length: 5 }, () => ALPHABET[Math.floor(Math.random() * ALPHABET.length)]).join(
      "",
    );
    if (!(await st.get(keyFor(candidate)))) {
      id = candidate;
      break;
    }
  }
  if (!id) return null;
  const session: Session = { id, name: name.slice(0, 60), created: Date.now(), topicIdx: 0, v: 1, qs: [] };
  await put(session);
  return session;
}

function touch(session: Session): Session {
  session.v = (session.v || 0) + 1;
  return session;
}

export async function addQuestion(
  id: string,
  t: string,
  q: string,
  who: string,
): Promise<{ session: Session; question: Question } | null> {
  const session = await getSession(id);
  if (!session) return null;
  const question: Question = {
    id: "q" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    t: t || "work",
    q: q.slice(0, 240),
    who: who.slice(0, 40),
    adj: 0,
    at: Date.now(),
  };
  session.qs.push(question);
  touch(session);
  await put(session);
  return { session, question };
}

export async function bulkAddQuestions(
  id: string,
  items: { t: string; q: string; who?: string }[],
): Promise<Session | null> {
  const session = await getSession(id);
  if (!session) return null;
  const have = new Set(session.qs.map((x) => x.q));
  for (const x of items.slice(0, 60)) {
    const q = String(x.q || "").trim().slice(0, 240);
    if (!q || have.has(q)) continue;
    have.add(q);
    session.qs.push({
      id: "q" + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36),
      t: String(x.t || "work"),
      q,
      who: String(x.who || "").slice(0, 40),
      adj: 0,
      at: Date.now(),
    });
  }
  touch(session);
  await put(session);
  return session;
}

export async function deleteQuestion(id: string, questionId: string): Promise<Session | null> {
  const session = await getSession(id);
  if (!session) return null;
  session.qs = session.qs.filter((q) => q.id !== questionId);
  touch(session);
  await put(session);
  return session;
}

export async function setTopic(id: string, topicIdx: number): Promise<Session | null> {
  const session = await getSession(id);
  if (!session) return null;
  session.topicIdx = Math.max(0, Math.min(4, topicIdx | 0));
  touch(session);
  await put(session);
  return session;
}

export async function setAdj(id: string, questionId: string, adj: number): Promise<Session | null> {
  const session = await getSession(id);
  if (!session) return null;
  const q = session.qs.find((x) => x.id === questionId);
  if (q) q.adj = Math.max(-3, Math.min(3, adj | 0));
  touch(session);
  await put(session);
  return session;
}

export async function setName(id: string, name: string): Promise<Session | null> {
  const session = await getSession(id);
  if (!session) return null;
  session.name = name.slice(0, 60);
  touch(session);
  await put(session);
  return session;
}
