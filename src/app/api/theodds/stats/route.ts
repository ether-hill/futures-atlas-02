/**
 * GET  /api/theodds/stats   → the full tally (see Tally in the store)
 * POST /api/theodds/stats   { outcome, session?, thinker? } → { ok }
 *
 * Counts only. `session` is an opaque id the page mints in sessionStorage; it
 * exists so the tally can say how many PLAYERS kept rolling until doom, not
 * just how many rolls came up doom, and it is never stored alongside anything
 * that could identify who sent it. When no store is provisioned the route says
 * `configured: false` so the stats page can tell the reader plays aren't being
 * recorded instead of showing a number nobody produced.
 */
import { NextResponse } from "next/server";
import {
  isThinker,
  readStats,
  recordOutcome,
  statsConfigured,
} from "@/lib/theodds/stats-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const noStore = { "cache-control": "no-store" };

export async function GET() {
  const configured = statsConfigured();
  const stats = await readStats();
  return NextResponse.json({ ok: true, configured, ...(stats ?? {}) }, { headers: noStore });
}

export async function POST(req: Request) {
  let body: { outcome?: unknown; session?: unknown; thinker?: unknown };
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

  // Length-capped so a client cannot mint unbounded keys in the store.
  const session =
    typeof body.session === "string" && /^[a-z0-9]{6,40}$/i.test(body.session)
      ? body.session
      : undefined;

  await recordOutcome(body.outcome === "doom", {
    session,
    thinker: isThinker(body.thinker) ? body.thinker : undefined,
  });

  return NextResponse.json({ ok: true }, { headers: noStore });
}
