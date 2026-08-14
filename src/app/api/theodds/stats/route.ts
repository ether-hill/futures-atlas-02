/**
 * GET  /api/theodds/stats               → { ok, configured, plays, doom }
 * POST /api/theodds/stats  { outcome }  → { ok, plays, doom }
 *
 * Counts only. Nothing identifying is stored, and when no store is
 * provisioned the route says `configured: false` so the stats page can tell
 * the reader plays aren't being recorded instead of showing a number nobody
 * produced.
 */
import { NextResponse } from "next/server";
import { readStats, recordOutcome, statsConfigured } from "@/lib/theodds/stats-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = statsConfigured();
  const stats = await readStats();
  return NextResponse.json(
    { ok: true, configured, plays: stats?.plays ?? 0, doom: stats?.doom ?? 0 },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let body: { outcome?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  if (body.outcome !== "doom" && body.outcome !== "survive") {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  if (!statsConfigured()) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }

  await recordOutcome(body.outcome === "doom");
  const stats = await readStats();
  return NextResponse.json(
    { ok: true, plays: stats?.plays ?? 0, doom: stats?.doom ?? 0 },
    { headers: { "cache-control": "no-store" } },
  );
}
