/**
 * The rate limiter, exercised against a real counter store.
 *
 * src/lib/rate-limit.ts is the only thing between eight public POSTs and an
 * unbounded Anthropic / ElevenLabs bill, and until this file existed its
 * limiting branch had never run: it needs Redis, no developer machine has one,
 * and it fails OPEN when Redis is missing, so every local exercise of it took
 * the "no store, allow everything" path and looked like it worked.
 *
 * test/helpers/fake-redis.mjs gives it a real socket to count on (see the notes
 * there), so what is asserted below is the actual arithmetic on actual keys.
 *
 *   node --test test/rate-limit.test.mjs
 */
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { startFakeRedis, startFakeUpstash, startBlackHole } from "./helpers/fake-redis.mjs";

const execFileAsync = promisify(execFile);
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PROBE = fileURLToPath(new URL("./helpers/limiter-probe.mjs", import.meta.url));

// ---------------------------------------------------------------- the module

const redis = await startFakeRedis();
process.env.REDIS_URL = redis.url;
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const { rateLimit, callerIp } = await import("../src/lib/rate-limit.ts");

const post = (ip) =>
  new Request("https://futures-atlas.vercel.app/api/swipe/sector", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });

// Warm the connection up on the real clock before the clock is stubbed.
await rateLimit(post("198.51.100.1"), "warmup", { perIp: 1000, perIpWindowSec: 60, budget: 1000 });
redis.clear();

// ----------------------------------------------------------------- the clock
// The windows are clock-aligned (floor(now / window)), so owning Date.now is
// what makes the boundary cases testable at all. The fake store reads the same
// clock, so its keys expire when the tests say they do.

const DAY = 86400;
const realNow = Date.now;
let clock = Math.floor(Date.now() / (DAY * 1000)) * DAY * 1000; // midnight UTC
Date.now = () => clock;

const sec = () => Math.floor(clock / 1000);
const at = (s) => { clock = s * 1000; };
const advance = (s) => { clock += s * 1000; };
const ipKey = (name, ip, win) => `fa:rl:${name}:ip:${ip}:${Math.floor(sec() / win)}`;
const allKey = (name, win) => `fa:rl:${name}:all:${Math.floor(sec() / win)}`;

/** The options the routes actually pass, shrunk so a test can reach the edge. */
const opts = (o = {}) => ({ perIp: 3, perIpWindowSec: 60, budget: 1000, budgetWindowSec: DAY, ...o });

const call = (ip, name, o) => rateLimit(post(ip), name, opts(o));

/** Runs the module in a fresh process with a chosen environment. */
async function probe(cfg) {
  const { stdout } = await execFileAsync(process.execPath, [PROBE, JSON.stringify(cfg)], { cwd: ROOT });
  return JSON.parse(stdout);
}

// ------------------------------------------------------------------- the ask

test("the address of the caller", () => {
  assert.equal(callerIp(post("203.0.113.9")), "203.0.113.9");
  const chained = new Request("https://x.test", { headers: { "x-forwarded-for": " 203.0.113.9 , 10.0.0.1 " } });
  assert.equal(callerIp(chained), "203.0.113.9", "the client is the first hop, not the proxy");
  const real = new Request("https://x.test", { headers: { "x-real-ip": "203.0.113.20" } });
  assert.equal(callerIp(real), "203.0.113.20");
  assert.equal(callerIp(new Request("https://x.test")), "unknown");
});

test("the Nth call is allowed and the N+1th is refused", async () => {
  const name = "boundary";
  const ip = "203.0.113.1";
  for (let i = 1; i <= 3; i++) {
    const v = await call(ip, name);
    assert.equal(v.ok, true, `call ${i} of 3 should be allowed`);
    assert.equal(v.retryAfter, 0);
    assert.equal(v.hit, undefined);
  }
  const over = await call(ip, name);
  assert.equal(over.ok, false, "the 4th call of a limit of 3 must be refused");
  assert.equal(over.hit, "ip");
  assert.equal(redis.value(ipKey(name, ip, 60)), 4, "the refused call still counted");

  // and it stays refused for the rest of the window
  assert.equal((await call(ip, name)).ok, false);
});

test("retryAfter is positive, never longer than the window, and right at both ends of a slot", async () => {
  // At the very start of a slot: the whole window is still to run.
  at(Math.floor(sec() / 60) * 60 + 60);
  for (let i = 0; i < 3; i++) await call("203.0.113.2", "edges");
  const atStart = await call("203.0.113.2", "edges");
  assert.equal(atStart.ok, false);
  assert.equal(atStart.retryAfter, 60, "refused on the first second of a slot: a full window to wait");

  // At the very last second of a slot: one second, not a full window.
  at(Math.floor(sec() / 60) * 60 + 59);
  const atEnd = await call("203.0.113.2", "edges");
  assert.equal(atEnd.ok, false);
  assert.equal(atEnd.retryAfter, 1, "refused on the last second of a slot: one second to wait");

  // Everywhere in between.
  for (let offset = 0; offset < 60; offset++) {
    at(Math.floor(sec() / 60) * 60 + 60 + offset);
    const ip = `203.0.113.${100 + offset}`;
    for (let i = 0; i < 3; i++) await call(ip, "sweep");
    const v = await call(ip, "sweep");
    assert.equal(v.ok, false);
    assert.ok(v.retryAfter > 0, `retryAfter must be positive (offset ${offset}, got ${v.retryAfter})`);
    assert.ok(v.retryAfter <= 60, `retryAfter must not exceed the window (offset ${offset}, got ${v.retryAfter})`);
    assert.equal(v.retryAfter, 60 - offset, `retryAfter must name the real end of the slot (offset ${offset})`);
  }
});

test("two addresses get two buckets", async () => {
  const name = "two-ips";
  for (let i = 0; i < 4; i++) await call("203.0.113.3", name);
  assert.equal((await call("203.0.113.3", name)).ok, false, "the first address is spent");
  const other = await call("203.0.113.4", name);
  assert.equal(other.ok, true, "a different address must be untouched by it");
  assert.equal(redis.value(ipKey(name, "203.0.113.4", 60)), 1);
});

test("a busy /api/swipe does not lock out /api/swipe/sector", async () => {
  const ip = "203.0.113.5";
  for (let i = 0; i < 5; i++) await call(ip, "swipe");
  assert.equal((await call(ip, "swipe")).ok, false, "swipe is spent");
  const sector = await call(ip, "swipe-sector");
  assert.equal(sector.ok, true, "the expensive route must have its own counter");
  assert.equal(redis.value(ipKey("swipe-sector", ip, 60)), 1);
});

test("the daily budget refuses even when the caller's own count is fine", async () => {
  const name = "budget";
  const o = { perIp: 100, perIpWindowSec: 60, budget: 2, budgetWindowSec: DAY };
  assert.equal((await call("203.0.113.10", name, o)).ok, true);
  assert.equal((await call("203.0.113.11", name, o)).ok, true);

  const v = await call("203.0.113.12", name, o);
  assert.equal(v.ok, false, "the budget is spent, whoever is asking");
  assert.equal(v.hit, "budget", "and it must say which limit refused");
  assert.ok(v.retryAfter > 0 && v.retryAfter <= DAY, `retryAfter ${v.retryAfter} out of range`);
  assert.equal(v.retryAfter, DAY - (sec() % DAY), "seconds to the end of the budget day");

  // The refusal is not the per-IP limit wearing a different hat: this caller
  // has spent 1 of 100.
  assert.equal(redis.value(ipKey(name, "203.0.113.12", 60)), 1);
});

test("a call refused on the address does not spend the shared budget", async () => {
  const name = "no-steal";
  const o = { perIp: 2, perIpWindowSec: 60, budget: 10, budgetWindowSec: DAY };
  const from = redis.mark();

  const greedy = "203.0.113.13";
  for (let i = 0; i < 2; i++) assert.equal((await call(greedy, name, o)).ok, true);
  for (let i = 0; i < 50; i++) assert.equal((await call(greedy, name, o)).ok, false);

  assert.equal(redis.value(allKey(name, DAY)), 2, "52 requests, 2 allowed, so 2 of the budget");
  assert.equal(redis.count("INCR", /:all:/, from), 2, "the budget counter was touched exactly twice");
  assert.equal(redis.count("INCR", /:ip:/, from), 52, "every attempt still cost the caller's own counter");

  // The budget is therefore still there for everyone else: 8 left, and the
  // ninth is refused on the budget, not on anyone's address.
  for (let i = 0; i < 8; i++) {
    assert.equal((await call(`198.51.100.${i}`, name, o)).ok, true, `bystander ${i} should get through`);
  }
  const last = await call("198.51.100.99", name, o);
  assert.equal(last.ok, false);
  assert.equal(last.hit, "budget");
});

test("the counters expire, and a fresh window starts clean", async () => {
  const name = "expiry";
  const ip = "203.0.113.14";
  const from = redis.mark();
  const key = ipKey(name, ip, 60);
  const budgetKey = allKey(name, DAY);

  await call(ip, name);
  assert.equal(redis.ttl(key), 60, "the per-IP counter carries the window as its TTL");
  assert.equal(redis.ttl(budgetKey), DAY, "the budget counter carries the day");

  for (let i = 0; i < 2; i++) await call(ip, name);
  assert.equal(redis.count("EXPIRE", null, from), 2, "EXPIRE is sent once per counter, not once per call");
  assert.equal((await call(ip, name)).ok, false, "spent for this window");

  advance(61);
  assert.equal(redis.has(key), false, "the old slot's key is gone from the store");
  const next = await call(ip, name);
  assert.equal(next.ok, true, "the next window starts at zero");
  assert.equal(redis.value(ipKey(name, ip, 60)), 1);

  // The budget is a day, so it survives the minute rolling over.
  assert.equal(redis.value(budgetKey), 4, "3 allowed before, 1 after");
});

test("N+5 at once let exactly N through", async () => {
  const name = "race";
  const ip = "203.0.113.15";
  const o = { perIp: 10, perIpWindowSec: 60, budget: 1000, budgetWindowSec: DAY };
  const results = await Promise.all(Array.from({ length: 15 }, () => call(ip, name, o)));
  assert.equal(results.filter((v) => v.ok).length, 10, "exactly the limit, no matter the ordering");
  assert.equal(results.filter((v) => !v.ok && v.hit === "ip").length, 5);
  assert.equal(redis.value(allKey(name, DAY)), 10, "and only the allowed ones spent budget");
});

test("N+5 at once cannot overrun the budget either", async () => {
  const name = "race-budget";
  const o = { perIp: 100, perIpWindowSec: 60, budget: 10, budgetWindowSec: DAY };
  const results = await Promise.all(
    Array.from({ length: 15 }, (_, i) => call(`198.51.100.${100 + i}`, name, o)),
  );
  assert.equal(results.filter((v) => v.ok).length, 10);
  assert.equal(results.filter((v) => v.hit === "budget").length, 5);
});

test("a store that errors mid-flight fails open", async () => {
  const name = "fault";
  const ip = "203.0.113.16";
  const o = { perIp: 1, perIpWindowSec: 60, budget: 1000, budgetWindowSec: DAY };
  assert.equal((await call(ip, name, o)).ok, true);
  assert.equal((await call(ip, name, o)).ok, false, "genuinely over the limit");

  redis.setFault((cmd) => (cmd === "INCR" ? "error" : null));
  const blind = await call(ip, name, o);
  assert.equal(blind.ok, true, "no counter, no refusal: a Redis blip must not take the demo down");
  assert.equal(blind.retryAfter, 0);

  // An error on the budget counter alone is the same story.
  redis.setFault((cmd, key) => (cmd === "INCR" && /:all:/.test(key) ? "error" : null));
  assert.equal((await call("203.0.113.17", name, o)).ok, true);

  redis.setFault(null);
  assert.equal((await call(ip, name, o)).ok, false, "and the limit comes straight back when Redis does");
});

test("a store that accepts and never answers fails open, and quickly", async () => {
  const hole = await startBlackHole();
  try {
    const out = await probe({ env: { REDIS_URL: hole.url }, calls: 1, callTimeoutMs: 15000 });
    assert.equal(out.timedOut, false, "rateLimit must not hang on an unresponsive Redis");
    assert.equal(out.verdicts[0]?.ok, true, "an unresponsive store fails open");
    assert.ok(out.ms < 5000, `should give up on its own deadline, took ${out.ms}ms`);
  } finally {
    await hole.close();
  }
});

test("a Redis that refuses the connection fails open", async () => {
  const out = await probe({ env: { REDIS_URL: "redis://127.0.0.1:1" }, calls: 1, callTimeoutMs: 15000 });
  assert.equal(out.threw, null);
  assert.equal(out.timedOut, false);
  assert.equal(out.verdicts[0]?.ok, true);
});

test("a malformed REDIS_URL fails open rather than throwing into the route", async () => {
  const out = await probe({ env: { REDIS_URL: "not a url" }, calls: 2, callTimeoutMs: 15000 });
  assert.equal(out.threw, null, "a typo in an env var must not throw out of rateLimit");
  assert.deepEqual(out.verdicts, [{ ok: true, retryAfter: 0 }, { ok: true, retryAfter: 0 }]);
});

test("no Redis configured at all is unlimited, not broken", async () => {
  const out = await probe({
    env: {},
    calls: 4,
    opts: { perIp: 1, perIpWindowSec: 60, budget: 1, budgetWindowSec: DAY },
  });
  assert.equal(out.threw, null);
  assert.equal(out.verdicts.length, 4);
  assert.ok(out.verdicts.every((v) => v.ok), "a developer machine with no Redis is simply unlimited");
});

test("the Upstash REST branch counts too", async () => {
  const kv = await startFakeUpstash();
  try {
    const out = await probe({
      env: { KV_REST_API_URL: kv.url, KV_REST_API_TOKEN: kv.token },
      calls: 5,
      ip: "203.0.113.30",
      name: "upstash",
      opts: { perIp: 3, perIpWindowSec: 60, budget: 1000, budgetWindowSec: DAY },
    });
    assert.equal(out.threw, null);
    assert.deepEqual(
      out.verdicts.map((v) => v.ok),
      [true, true, true, false, false],
      "the same arithmetic over KV_REST_API_URL as over REDIS_URL",
    );
    assert.ok(out.verdicts[3].retryAfter > 0 && out.verdicts[3].retryAfter <= 60);
    assert.equal(out.verdicts[3].hit, "ip");
    assert.equal(kv.count("EXPIRE"), 2, "one TTL for the address counter, one for the budget");
    assert.equal(kv.count("INCR", /:all:/), 3, "and the two refused calls spent no budget here either");
  } finally {
    await kv.close();
  }
});

after(async () => {
  Date.now = realNow;
  // The ioredis connection belongs to the module under test and there is no
  // handle on it out here, so let go of every socket rather than close it.
  const stdio = new Set([process.stdout, process.stderr, process.stdin]);
  for (const h of process._getActiveHandles?.() ?? []) if (!stdio.has(h)) h.unref?.();
});
