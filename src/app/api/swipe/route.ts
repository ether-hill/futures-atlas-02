/**
 * GET  /api/swipe — aggregated Swipe-the-Future metrics (for the hidden dashboard).
 * POST /api/swipe — record one answer { cardId, category, verdict, believe } or { round: true }.
 * Backed by Redis HINCRBY (see lib/swipe-stats). No-ops if KV is unset.
 */
import { NextResponse } from "next/server";
import { trackAnswer, trackRound, readStats, type Verdict } from "@/lib/swipe-stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERDICTS: Verdict[] = ["unlikely", "contested", "likely", "already"];
const clean = (x: unknown) => (typeof x === "string" ? x.replace(/[^a-z0-9-]/gi, "").slice(0, 48) : "");

export async function GET() {
  return NextResponse.json(await readStats(), { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (body.round) { await trackRound(); return NextResponse.json({ ok: true }); }
  const cardId = clean(body.cardId);
  const category = clean(body.category);
  const verdict = body.verdict as Verdict;
  if (!cardId || !VERDICTS.includes(verdict)) return NextResponse.json({ ok: false }, { status: 400 });
  await trackAnswer({ cardId, category, verdict, believe: !!body.believe });
  return NextResponse.json({ ok: true });
}
