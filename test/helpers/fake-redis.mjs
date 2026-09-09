/**
 * A Redis good enough for `ioredis` and for `@upstash/redis`, in one file with
 * no dependencies.
 *
 * src/lib/rate-limit.ts fails OPEN when there is no counter store, and there is
 * no Redis on a developer machine, so every local exercise of that module has
 * silently taken the fail-open path and the limiting logic has never run. This
 * gives it a real store to count in: one small command engine (INCR, EXPIRE,
 * TTL, GET, DEL, and the handshake commands the clients send), wrapped once as
 * a RESP2 TCP server for the ioredis branch and once as an HTTP endpoint for
 * the Upstash REST branch.
 *
 * Three things a real Redis could not give the tests:
 *   - the store is inspectable in-process (`value`, `ttl`, `has`, `keys`)
 *   - every command is logged, so "did this request touch the budget counter?"
 *     is a recorded fact rather than an inference from the verdict
 *   - faults can be injected per command and key, mid-flight
 *
 * Expiry reads `Date.now()` when it is asked, so a test that stubs the clock
 * moves this store's windows with it.
 */
import net from "node:net";
import http from "node:http";

const CRLF = "\r\n";
const OK = { simple: "OK" };

const INFO_BODY = [
  "# Server", "redis_version:7.2.4", "redis_mode:standalone", "os:fake",
  "# Clients", "connected_clients:1",
  "# Replication", "role:master", "connected_slaves:0", "master_repl_offset:0",
  "# Persistence", "loading:0", "rdb_bgsave_in_progress:0",
  "# Keyspace", "",
].join(CRLF);

/** The store itself, transport-independent. */
export function createEngine() {
  /** key -> { n, expiresAt: number | null } */
  const keys = new Map();
  const log = [];
  /** (cmd, key) => "error" | "hang" | null */
  let fault = null;

  const alive = (key) => {
    const e = keys.get(key);
    if (!e) return null;
    if (e.expiresAt !== null && Date.now() >= e.expiresAt) { keys.delete(key); return null; }
    return e;
  };

  /** Returns a reply, an Error, or undefined meaning "never answer". */
  function run(args) {
    const cmd = String(args[0] ?? "").toUpperCase();
    const key = args[1];
    log.push({ cmd, key, args: args.slice(1) });
    const f = fault?.(cmd, key);
    if (f === "error") return new Error("ERR simulated store failure");
    if (f === "hang") return undefined;
    switch (cmd) {
      case "INCR": {
        const e = alive(key);
        if (e) return (e.n += 1);
        keys.set(key, { n: 1, expiresAt: null });
        return 1;
      }
      case "EXPIRE": {
        const e = alive(key);
        if (!e) return 0;
        e.expiresAt = Date.now() + Number(args[2]) * 1000;
        return 1;
      }
      case "TTL": {
        const e = alive(key);
        if (!e) return -2;
        return e.expiresAt === null ? -1 : Math.ceil((e.expiresAt - Date.now()) / 1000);
      }
      case "GET": { const e = alive(key); return e ? String(e.n) : null; }
      case "DEL": { const had = alive(key) ? 1 : 0; keys.delete(key); return had; }
      case "EXISTS": return alive(key) ? 1 : 0;
      case "FLUSHALL": keys.clear(); return OK;
      case "PING": return { simple: "PONG" };
      case "INFO": return INFO_BODY;
      case "QUIT": return OK;
      case "COMMAND": return [];
      default: return OK; // CLIENT / SELECT / AUTH / HELLO / anything else
    }
  }

  return {
    run,
    log,
    value: (key) => alive(key)?.n ?? null,
    ttl: (key) => { const e = alive(key); return !e ? -2 : e.expiresAt === null ? -1 : Math.ceil((e.expiresAt - Date.now()) / 1000); },
    has: (key) => alive(key) !== null,
    keys: () => [...keys.keys()].filter((k) => alive(k)),
    mark: () => log.length,
    /** e.g. count("INCR", /:all:/, mark) */
    count: (cmd, keyMatch, from = 0) =>
      log.slice(from).filter((e) => e.cmd === cmd && (!keyMatch || keyMatch.test(e.key ?? ""))).length,
    clear: () => { keys.clear(); log.length = 0; },
    setFault: (fn) => { fault = fn; },
  };
}

// ---------------------------------------------------------------- RESP / TCP

function encode(reply) {
  if (reply === null) return `$-1${CRLF}`;
  if (typeof reply === "number") return `:${reply}${CRLF}`;
  if (reply instanceof Error) return `-${reply.message}${CRLF}`;
  if (reply && reply.simple) return `+${reply.simple}${CRLF}`;
  if (Array.isArray(reply)) return `*${reply.length}${CRLF}` + reply.map(encode).join("");
  const s = String(reply);
  return `$${Buffer.byteLength(s)}${CRLF}${s}${CRLF}`;
}

/** Incremental RESP2 request parser. Emits whole commands, returns the tail. */
function drain(buf, onCommand) {
  let rest = buf;
  for (;;) {
    if (rest.length === 0) return rest;
    if (rest[0] !== 0x2a /* '*' */) {
      const nl = rest.indexOf(CRLF);
      if (nl === -1) return rest;
      const line = rest.subarray(0, nl).toString().trim();
      rest = rest.subarray(nl + 2);
      if (line) onCommand(line.split(/\s+/));
      continue;
    }
    const head = rest.indexOf(CRLF);
    if (head === -1) return rest;
    const count = Number(rest.subarray(1, head).toString());
    let off = head + 2;
    const args = [];
    let short = false;
    for (let i = 0; i < count; i++) {
      const lenEnd = rest.indexOf(CRLF, off);
      if (lenEnd === -1) { short = true; break; }
      const len = Number(rest.subarray(off + 1, lenEnd).toString());
      const start = lenEnd + 2;
      if (rest.length < start + len + 2) { short = true; break; }
      args.push(rest.subarray(start, start + len).toString());
      off = start + len + 2;
    }
    if (short) return rest;
    rest = rest.subarray(off);
    onCommand(args);
  }
}

/** A Redis on a real socket, for the `ioredis` branch (REDIS_URL). */
export async function startFakeRedis() {
  const engine = createEngine();
  const sockets = new Set();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.on("error", () => {});
    let buf = Buffer.alloc(0);
    socket.on("data", (chunk) => {
      buf = drain(Buffer.concat([buf, chunk]), (args) => {
        const reply = engine.run(args);
        if (reply === undefined) return; // hang: never answer
        socket.write(encode(reply));
      });
    });
  });
  await new Promise((res) => server.listen(0, "127.0.0.1", res));
  return {
    ...engine,
    url: `redis://127.0.0.1:${server.address().port}`,
    close: async () => {
      for (const s of sockets) s.destroy();
      await new Promise((res) => server.close(res));
    },
  };
}

// -------------------------------------------------------------- Upstash REST

/** The REST endpoint @upstash/redis talks to (KV_REST_API_URL/TOKEN). */
export async function startFakeUpstash({ token = "tok" } = {}) {
  const engine = createEngine();
  const one = (args) => {
    const reply = engine.run(args);
    if (reply instanceof Error) return { error: reply.message };
    if (reply && reply.simple) return { result: reply.simple };
    return { result: reply === undefined ? null : reply };
  };
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      if (req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: "Unauthorized" }));
      }
      let payload;
      try { payload = JSON.parse(body || "[]"); } catch { payload = []; }
      const pipelined = req.url.startsWith("/pipeline") || req.url.startsWith("/multi-exec");
      const out = pipelined ? payload.map(one) : one(payload);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(out));
    });
  });
  await new Promise((res) => server.listen(0, "127.0.0.1", res));
  return {
    ...engine,
    url: `http://127.0.0.1:${server.address().port}`,
    token,
    close: async () => { await new Promise((r) => server.close(r)); },
  };
}

/** Accepts the connection, then says nothing at all, ever. */
export async function startBlackHole() {
  const sockets = new Set();
  const server = net.createServer((s) => { sockets.add(s); s.on("error", () => {}); });
  await new Promise((res) => server.listen(0, "127.0.0.1", res));
  return {
    url: `redis://127.0.0.1:${server.address().port}`,
    close: async () => { for (const s of sockets) s.destroy(); await new Promise((r) => server.close(r)); },
  };
}
