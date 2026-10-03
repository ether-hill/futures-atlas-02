/**
 * GET  /api/swipe        aggregated Swipe the Future metrics.
 *                        `?v=2` reads the already/not-yet tally, anything else
 *                        reads v1's true/false tally.
 * POST /api/swipe        record one answer, or { round: true } to close a round.
 *
 * Two games post here. v2 (the live deck) sends { v: 2, cardId, category,
 * verdict: "notyet"|"already", real } and lands in the v2 hash. v1 (frozen, at
 * /swipe-v1) sends its original shape with no version field and keeps writing
 * to the original hash. They are never pooled: they are answers to two
 * different questions, and an average of the two would mean nothing.
 *
 * Backed by Redis HINCRBY (see lib/swipe-stats). No-ops if KV is unset.
 */
import { NextResponse } from "next/server";
import {
  trackAnswerV1, trackAnswerV2, trackRound, readStats,
  VERDICTS_V1, VERDICTS_V2, type VerdictV1, type VerdictV2,
} from "@/lib/swipe-stats";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clean = (x: unknown) => (typeof x === "string" ? x.replace(/[^a-z0-9-]/gi, "").slice(0, 48) : "");

export async function GET(req: Request) {
  const version = new URL(req.url).searchParams.get("v") === "2" ? 2 : 1;
  return NextResponse.json(await readStats(version), { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }

  const version = body.v === 2 ? 2 : 1;

  /*
   * A vote and a round close are both Redis writes, so both are counted. This
   * one is not about spend, it is about ballot stuffing: the tallies on
   * /swipe-the-future/stats are the only real numbers on the site, and a script
   * posting the same verdict in a loop would turn them into a made-up figure.
   *
   * 200 an hour is roughly ten full rounds, far more than anyone plays and far
   * less than a script manages in a minute. The daily 20,000 is a runaway
   * catch, well above any traffic this deck has ever seen, because the counter
   * that stops a bad actor must not also stop a real audience mid-session.
   */
  const gate = await rateLimit(req, "swipe", {
    perIp: 200,
    perIpWindowSec: 3600,
    budget: 20000,
  });
  if (!gate.ok) {
    return NextResponse.json(
      { ok: false, code: "rate_limited" },
      { status: 429, headers: { "retry-after": String(gate.retryAfter) } },
    );
  }

  if (body.round) { await trackRound(version); return NextResponse.json({ ok: true }); }

  const cardId = clean(body.cardId);
  const category = clean(body.category);
  if (!cardId) return NextResponse.json({ ok: false }, { status: 400 });

  if (version === 2) {
    const verdict = body.verdict as VerdictV2;
    if (!VERDICTS_V2.includes(verdict)) return NextResponse.json({ ok: false }, { status: 400 });
    await trackAnswerV2({ cardId, category, verdict, real: !!body.real });
  } else {
    const verdict = body.verdict as VerdictV1;
    if (!VERDICTS_V1.includes(verdict)) return NextResponse.json({ ok: false }, { status: 400 });
    await trackAnswerV1({ cardId, category, verdict, believe: !!body.believe });
  }
  return NextResponse.json({ ok: true });
}
