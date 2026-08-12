/**
 * GET  /api/feed/poll            → { ok, configured, tallies: { [pollId]: { [optionId]: n } } }
 * POST /api/feed/poll  { id, option }  → { ok, tally }
 *
 * Counts only. Nothing identifying is stored, and when no store is provisioned
 * the route says `configured: false` so the card can tell the reader answers
 * aren't being recorded instead of showing a number nobody gave.
 */
import { NextResponse } from "next/server";
import { POLLS, pollById } from "@/data/polls";
import { castVote, pollsConfigured, readTally } from "@/lib/feed/poll-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configured = pollsConfigured();
  const entries = await Promise.all(
    POLLS.map(async (p) => [p.id, (await readTally(p.id)) ?? {}] as const),
  );
  return NextResponse.json(
    { ok: true, configured, tallies: Object.fromEntries(entries) },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(req: Request) {
  let body: { id?: unknown; option?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, code: "bad_request" }, { status: 400 });
  }

  const poll = typeof body.id === "string" ? pollById(body.id) : undefined;
  const option =
    poll && typeof body.option === "string"
      ? poll.options.find((o) => o.id === body.option)
      : undefined;

  // Validate against the definitions rather than trusting the body: this is a
  // public endpoint, and an unchecked field would let anyone write arbitrary
  // keys into the hash.
  if (!poll || !option) {
    return NextResponse.json({ ok: false, code: "unknown_poll" }, { status: 400 });
  }

  if (!pollsConfigured()) {
    return NextResponse.json({ ok: false, code: "not_configured" }, { status: 503 });
  }

  await castVote(poll.id, option.id);
  return NextResponse.json(
    { ok: true, tally: (await readTally(poll.id)) ?? {} },
    { headers: { "cache-control": "no-store" } },
  );
}
