/**
 * Runs src/lib/rate-limit.ts in a fresh process with a chosen environment and
 * prints the verdicts as JSON. Used for the cases that need module state the
 * main test process cannot rewind: no Redis configured at all, a Redis that
 * refuses connections, one that accepts and never answers, and the Upstash
 * REST branch. Also the only honest way to time a call that may never return.
 *
 * argv[2] is JSON: { env, name, ip, calls, opts, callTimeoutMs }
 */
const cfg = JSON.parse(process.argv[2]);

for (const k of ["REDIS_URL", "KV_REST_API_URL", "KV_REST_API_TOKEN"]) delete process.env[k];
Object.assign(process.env, cfg.env || {});

const out = { verdicts: [], threw: null, timedOut: false, ms: 0 };
const started = Date.now();
try {
  const { rateLimit } = await import("../../src/lib/rate-limit.ts");
  const opts = cfg.opts || { perIp: 2, perIpWindowSec: 60, budget: 100, budgetWindowSec: 3600 };
  for (let i = 0; i < (cfg.calls ?? 1); i++) {
    const req = new Request("https://example.test/api/x", {
      method: "POST",
      headers: { "x-forwarded-for": cfg.ip || "203.0.113.7" },
    });
    let timer;
    const verdict = await Promise.race([
      rateLimit(req, cfg.name || "probe", opts),
      new Promise((res) => { timer = setTimeout(() => res("__TIMEOUT__"), cfg.callTimeoutMs ?? 4000); }),
    ]);
    clearTimeout(timer);
    if (verdict === "__TIMEOUT__") { out.timedOut = true; break; }
    out.verdicts.push(verdict);
  }
} catch (err) {
  out.threw = `${err?.constructor?.name}: ${err?.message}`;
}
out.ms = Date.now() - started;
process.stdout.write(JSON.stringify(out));
process.exit(0);
